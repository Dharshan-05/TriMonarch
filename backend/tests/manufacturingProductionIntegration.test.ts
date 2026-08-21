import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingProductionService } from '../src/services/manufacturingProduction.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { manufacturingProductionRepository } from '../src/repositories/manufacturingProduction.repository';
import { manufacturingMaterialConsumptionService } from '../src/services/manufacturingMaterialConsumption.service';
import { inventoryService } from '../src/services/inventory.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { ManufacturingOrder } from '../src/types/database';

describe('Manufacturing Production Integration & Safety Boundaries (Phase 037)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';
  const prodId = 'prod-fg-table-001';
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
    planned_quantity: '50.0000',
    completed_quantity: '10.0000',
    produced_quantity: '10.0000',
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

  it('should increase finished goods stock and record ledger IN with MANUFACTURING_PRODUCTION reference', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingProductionRepository, 'findByProductionNumber').mockResolvedValue(null);

    const increaseStockSpy = vi.spyOn(inventoryService, 'increaseStock').mockResolvedValue({
      id: 'inv-fg-001',
      organization_id: orgId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '30.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(manufacturingProductionRepository, 'create').mockResolvedValue({
      id: 'prod-rec-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      product_id: prodId,
      warehouse_id: whId,
      production_number: 'PROD-FG-001',
      quantity: '20.0000',
      produced_by: null,
      produced_at: new Date(),
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({
      ...inProgressMo,
      produced_quantity: '30.0000',
      completed_quantity: '30.0000',
    });

    const decreaseStockSpy = vi.spyOn(inventoryService, 'decreaseStock');
    const adjustStockSpy = vi.spyOn(inventoryService, 'adjustStock');

    const res = await manufacturingProductionService.produceFinishedGoods(orgId, moId, {
      production_number: 'PROD-FG-001',
      quantity: '20.0000',
      notes: 'Finished 20 tables',
    });

    expect(res.production_complete).toBe(false);
    expect(res.produced_quantity).toBe('30.0000');

    // Verify increaseStock was called with MANUFACTURING_PRODUCTION
    expect(increaseStockSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: orgId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '20.0000',
        reference_type: 'MANUFACTURING_PRODUCTION',
      }),
      undefined,
      undefined,
      expect.anything(),
    );

    // VERIFY CRITICAL SAFETY BOUNDARIES:
    expect(decreaseStockSpy).not.toHaveBeenCalled();
    expect(adjustStockSpy).not.toHaveBeenCalled();
  });
});
