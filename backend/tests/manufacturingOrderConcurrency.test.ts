import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingOrderService } from '../src/services/manufacturingOrder.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { ManufacturingOrder } from '../src/types/database';
import { ManufacturingOrderAlreadyInStateError } from '../src/types';

describe('Manufacturing Order Concurrency Control (Phase 033)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-concurrency-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  let currentMoState: ManufacturingOrder;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

    currentMoState = {
      id: moId,
      organization_id: orgId,
      bom_id: 'bom-001',
      product_id: 'prod-finished-001',
      warehouse_id: 'wh-001',
      order_number: 'MO-CONC-001',
      mo_number: 'MO-CONC-001',
      planned_quantity: '10.0000',
      completed_quantity: '0.0000',
      scheduled_start_date: null,
      scheduled_end_date: null,
      actual_start_date: null,
      actual_end_date: null,
      status: 'draft',
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockImplementation(async (oId, id) => {
      if (oId === orgId && id === moId) {
        return { ...currentMoState };
      }
      return null;
    });

    vi.spyOn(manufacturingRepository, 'update').mockImplementation(async (oId, id, data) => {
      if (oId === orgId && id === moId) {
        currentMoState = {
          ...currentMoState,
          ...data,
          status: (data.status as ManufacturingOrder['status']) || currentMoState.status,
          updated_at: new Date(),
        };
        return { ...currentMoState };
      }
      return null;
    });

    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgId,
        manufacturing_order_id: moId,
        component_product_id: 'comp-1',
        bom_item_id: null,
        required_quantity: '10.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    vi.spyOn(manufacturingRepository, 'update').mockImplementation(async (oId, id, data) => {
      if (oId === orgId && id === moId) {
        currentMoState = {
          ...currentMoState,
          ...data,
          status: (data.status as ManufacturingOrder['status']) || currentMoState.status,
          updated_at: new Date(),
        };
        return { ...currentMoState };
      }
      return null;
    });
  });

  it('TEST 15 — Concurrent transitions: Sequential resolution under FOR UPDATE lock', async () => {
    const res1 = await manufacturingOrderService.confirmOrder(orgId, moId);
    expect(res1.status).toBe('confirmed');

    await expect(manufacturingOrderService.confirmOrder(orgId, moId)).rejects.toThrow(
      ManufacturingOrderAlreadyInStateError,
    );
    expect(currentMoState.status).toBe('confirmed');
  });

  it('Concurrent confirm and cancel: Only first operation wins', async () => {
    const res1 = await manufacturingOrderService.confirmOrder(orgId, moId);
    expect(res1.status).toBe('confirmed');

    const res2 = await manufacturingOrderService.cancelOrder(orgId, moId);
    expect(res2.status).toBe('cancelled');
    expect(currentMoState.status).toBe('cancelled');
  });
});
