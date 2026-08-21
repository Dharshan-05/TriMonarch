import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingOrderService } from '../src/services/manufacturingOrder.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { ManufacturingOrderNotFoundError } from '../src/types';
import { ManufacturingOrderStatusHistory } from '../src/types/database';

describe('Manufacturing Order Status History Subsystem (Phase 034)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const moId = 'mo-hist-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const mockHistoryRecords: ManufacturingOrderStatusHistory[] = [
    {
      id: 'hist-1',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      from_status: 'draft',
      to_status: 'confirmed',
      changed_by: 'user-001',
      reason: 'Work order approved by supervisor',
      request_id: 'req-001',
      metadata: { mo_number: 'MO-001' },
      created_at: new Date(Date.now() - 10000),
    },
    {
      id: 'hist-2',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      from_status: 'confirmed',
      to_status: 'planned',
      changed_by: 'user-001',
      reason: 'Scheduled on Line 1',
      request_id: 'req-002',
      metadata: { mo_number: 'MO-001' },
      created_at: new Date(Date.now() - 5000),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
  });

  it('TEST 14 — should retrieve chronological status history records for an MO', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockResolvedValue({
      id: moId,
      organization_id: orgAId,
      bom_id: 'bom-001',
      product_id: 'prod-001',
      warehouse_id: 'wh-001',
      order_number: 'MO-001',
      mo_number: 'MO-001',
      planned_quantity: '10.0000',
      completed_quantity: '0.0000',
      scheduled_start_date: null,
      scheduled_end_date: null,
      actual_start_date: null,
      actual_end_date: null,
      status: 'planned',
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(manufacturingRepository, 'listStatusHistory').mockResolvedValue(mockHistoryRecords);

    const history = await manufacturingOrderService.getStatusHistory(orgAId, moId);
    expect(history.length).toBe(2);
    expect(history[0]!.from_status).toBe('draft');
    expect(history[0]!.to_status).toBe('confirmed');
    expect(history[1]!.from_status).toBe('confirmed');
    expect(history[1]!.to_status).toBe('planned');
  });

  it('TEST 15 & 21 — should deny cross-tenant access to status history for Org B', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === moId) {
        return {
          id: moId,
          organization_id: orgAId,
          bom_id: 'bom-001',
          product_id: 'prod-001',
          warehouse_id: 'wh-001',
          order_number: 'MO-001',
          mo_number: 'MO-001',
          planned_quantity: '10.0000',
          completed_quantity: '0.0000',
          scheduled_start_date: null,
          scheduled_end_date: null,
          actual_start_date: null,
          actual_end_date: null,
          status: 'planned',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
      }
      return null;
    });

    await expect(manufacturingOrderService.getStatusHistory(orgBId, moId)).rejects.toThrow(
      ManufacturingOrderNotFoundError,
    );
  });
});
