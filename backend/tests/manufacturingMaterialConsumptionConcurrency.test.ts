import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingMaterialConsumptionService } from '../src/services/manufacturingMaterialConsumption.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { manufacturingMaterialConsumptionRepository } from '../src/repositories/manufacturingMaterialConsumption.repository';
import { inventoryService } from '../src/services/inventory.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { ManufacturingOrder } from '../src/types/database';
import { ManufacturingMaterialOverConsumptionError } from '../src/types';

describe('Manufacturing Material Consumption Concurrency (Phase 036)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';
  const itemId = 'item-001';
  const prodId = 'comp-001';
  const whId = 'wh-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const inProgressMo: ManufacturingOrder = {
    id: moId,
    organization_id: orgId,
    bom_id: 'bom-001',
    product_id: 'prod-fg-001',
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
    vi.spyOn(inventoryService, 'decreaseStock').mockResolvedValue({
      id: 'inv-001',
      organization_id: orgId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '100.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(manufacturingMaterialConsumptionRepository, 'create').mockResolvedValue({
      id: 'cons-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      manufacturing_order_item_id: itemId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '15.0000',
      consumed_at: new Date(),
      consumed_by: null,
      reference_number: null,
      notes: null,
      created_at: new Date(),
    });
  });

  it('TEST 12 — Concurrency & Oversubscription Prevention: Sequential execution prevents double-consumption beyond remaining quantity', async () => {
    let consumedQty = '80.0000'; // Required = 100, Remaining = 20

    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);

    vi.spyOn(manufacturingRepository, 'findItemById').mockImplementation(async () => {
      return {
        id: itemId,
        organization_id: orgId,
        manufacturing_order_id: moId,
        component_product_id: prodId,
        bom_item_id: null,
        required_quantity: '100.0000',
        consumed_quantity: consumedQty,
        unit: 'pcs',
        sequence: 1,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    vi.spyOn(manufacturingRepository, 'updateItem').mockImplementation(async (_orgId, _itemId, data) => {
      if (data.consumed_quantity !== undefined) {
        consumedQty = String(data.consumed_quantity);
      }
      return {
        id: itemId,
        organization_id: orgId,
        manufacturing_order_id: moId,
        component_product_id: prodId,
        bom_item_id: null,
        required_quantity: '100.0000',
        consumed_quantity: consumedQty,
        unit: 'pcs',
        sequence: 1,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    vi.spyOn(manufacturingRepository, 'listItems').mockImplementation(async () => [
      {
        id: itemId,
        organization_id: orgId,
        manufacturing_order_id: moId,
        component_product_id: prodId,
        bom_item_id: null,
        required_quantity: '100.0000',
        consumed_quantity: consumedQty,
        unit: 'pcs',
        sequence: 1,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Request 1: Consumes 15 (Remaining becomes 5, Consumed becomes 95)
    const firstRes = await manufacturingMaterialConsumptionService.consumeMaterials(orgId, moId, {
      items: [{ manufacturing_order_item_id: itemId, quantity: '15.0000' }],
    });

    expect(firstRes.items[0]!.consumed_quantity).toBe('95.0000');
    expect(firstRes.items[0]!.remaining_quantity).toBe('5.0000');

    // Request 2: Attempts to consume 15, but only 5 is remaining -> REJECTED with over-consumption error
    await expect(
      manufacturingMaterialConsumptionService.consumeMaterials(orgId, moId, {
        items: [{ manufacturing_order_item_id: itemId, quantity: '15.0000' }],
      }),
    ).rejects.toThrow(ManufacturingMaterialOverConsumptionError);

    expect(consumedQty).toBe('95.0000'); // Ensure state was not corrupted to 110!
  });
});
