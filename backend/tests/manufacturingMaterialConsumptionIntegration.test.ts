import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingMaterialConsumptionService } from '../src/services/manufacturingMaterialConsumption.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { manufacturingMaterialConsumptionRepository } from '../src/repositories/manufacturingMaterialConsumption.repository';
import { inventoryService } from '../src/services/inventory.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { ManufacturingOrder } from '../src/types/database';

describe('Manufacturing Material Consumption Integration & Safety Boundaries (Phase 036)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';
  const itemId = 'item-001';
  const prodId = 'comp-wood-001';
  const whId = 'wh-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const inProgressMo: ManufacturingOrder = {
    id: moId,
    organization_id: orgId,
    bom_id: 'bom-001',
    product_id: 'prod-fg-table-001',
    warehouse_id: whId,
    order_number: 'MO-001',
    mo_number: 'MO-001',
    planned_quantity: '10.0000',
    completed_quantity: '0.0000',
    scheduled_start_date: null,
    scheduled_end_date: null,
    actual_start_date: new Date(),
    actual_end_date: null,
    status: 'in_progress',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const baseItem = {
    id: itemId,
    organization_id: orgId,
    manufacturing_order_id: moId,
    component_product_id: prodId,
    bom_item_id: null,
    required_quantity: '40.0000',
    consumed_quantity: '0.0000',
    unit: 'pcs',
    sequence: 1,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
  });

  it('should decrease stock and record ledger OUT with MANUFACTURING_CONSUMPTION reference', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingRepository, 'findItemById').mockResolvedValue(baseItem);
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      { ...baseItem, consumed_quantity: '20.0000' },
    ]);
    vi.spyOn(manufacturingMaterialConsumptionRepository, 'findByReferenceNumber').mockResolvedValue(null);

    const decreaseStockSpy = vi.spyOn(inventoryService, 'decreaseStock').mockResolvedValue({
      id: 'inv-001',
      organization_id: orgId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '80.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const increaseStockSpy = vi.spyOn(inventoryService, 'increaseStock');
    const adjustStockSpy = vi.spyOn(inventoryService, 'adjustStock');

    const res = await manufacturingMaterialConsumptionService.consumeMaterials(orgId, moId, {
      items: [{ manufacturing_order_item_id: itemId, quantity: '20.0000' }],
      reference_number: 'CONSUME-REF-001',
      notes: 'Consuming raw wood',
    });

    expect(res.material_consumption_complete).toBe(false);

    // Verify decreaseStock was called with MANUFACTURING_CONSUMPTION
    expect(decreaseStockSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: orgId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '20.0000',
        reference_type: 'MANUFACTURING_CONSUMPTION',
        reference_id: moId,
      }),
      undefined,
      undefined,
      expect.anything(),
    );

    // VERIFY CRITICAL SAFETY BOUNDARIES:
    expect(increaseStockSpy).not.toHaveBeenCalled();
    expect(adjustStockSpy).not.toHaveBeenCalled();
  });
});
