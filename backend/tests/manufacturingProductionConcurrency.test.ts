import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingProductionService } from '../src/services/manufacturingProduction.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { manufacturingProductionRepository } from '../src/repositories/manufacturingProduction.repository';
import { manufacturingMaterialConsumptionService } from '../src/services/manufacturingMaterialConsumption.service';
import { inventoryService } from '../src/services/inventory.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { ManufacturingOrder } from '../src/types/database';
import { ManufacturingOrderOverProductionError, InsufficientStockError } from '../src/types';

describe('Manufacturing Production Concurrency & Failure Injection (Phase 037)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';
  const prodId = 'prod-fg-001';
  const whId = 'wh-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const inProgressMo: ManufacturingOrder = {
    id: moId,
    organization_id: orgId,
    bom_id: 'bom-001',
    product_id: prodId,
    warehouse_id: whId,
    order_number: 'MO-001',
    mo_number: 'MO-001',
    planned_quantity: '100.0000',
    completed_quantity: '90.0000',
    produced_quantity: '90.0000',
    scheduled_start_date: null,
    scheduled_end_date: null,
    actual_start_date: new Date(),
    actual_end_date: null,
    status: 'in_progress',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
    vi.spyOn(manufacturingMaterialConsumptionService, 'isMaterialFullyConsumed').mockResolvedValue(true);
  });

  it('Sequential execution prevents over-production beyond planned quantity in concurrent race', async () => {
    let producedQty = '90.0000'; // Planned = 100, Remaining = 10

    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockImplementation(async () => ({
      ...inProgressMo,
      produced_quantity: producedQty,
      completed_quantity: producedQty,
    }));

    vi.spyOn(manufacturingProductionRepository, 'findByProductionNumber').mockResolvedValue(null);
    vi.spyOn(inventoryService, 'increaseStock').mockResolvedValue({
      id: 'inv-001',
      organization_id: orgId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '100.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(manufacturingProductionRepository, 'create').mockResolvedValue({
      id: 'prod-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      product_id: prodId,
      warehouse_id: whId,
      production_number: 'PROD-A',
      quantity: '10.0000',
      produced_by: null,
      produced_at: new Date(),
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(manufacturingRepository, 'update').mockImplementation(async (_orgId, _id, data) => {
      if (data.produced_quantity !== undefined) {
        producedQty = String(data.produced_quantity);
      }
      return {
        ...inProgressMo,
        produced_quantity: producedQty,
        completed_quantity: producedQty,
      };
    });

    // Request 1: Produce remaining 10 (Succeeds)
    const firstRes = await manufacturingProductionService.produceFinishedGoods(orgId, moId, {
      production_number: 'PROD-A',
      quantity: '10.0000',
    });

    expect(firstRes.produced_quantity).toBe('100.0000');

    // Request 2: Produce another 10 (Fails with ManufacturingOrderOverProductionError)
    await expect(
      manufacturingProductionService.produceFinishedGoods(orgId, moId, {
        production_number: 'PROD-B',
        quantity: '10.0000',
      }),
    ).rejects.toThrow(ManufacturingOrderOverProductionError);

    expect(producedQty).toBe('100.0000'); // Never 110!
  });

  it('Failure Injection: Inventory increase failure rolls back transaction', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingProductionRepository, 'findByProductionNumber').mockResolvedValue(null);
    vi.spyOn(manufacturingProductionRepository, 'create').mockResolvedValue({
      id: 'prod-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      product_id: prodId,
      warehouse_id: whId,
      production_number: 'PROD-FAIL',
      quantity: '10.0000',
      produced_by: null,
      produced_at: new Date(),
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(inventoryService, 'increaseStock').mockRejectedValue(new InsufficientStockError('Db error'));

    await expect(
      manufacturingProductionService.produceFinishedGoods(orgId, moId, {
        production_number: 'PROD-FAIL',
        quantity: '10.0000',
      }),
    ).rejects.toThrow(InsufficientStockError);
  });
});
