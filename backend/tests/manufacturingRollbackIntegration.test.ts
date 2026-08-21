import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingRollbackService } from '../src/services/manufacturingRollback.service';
import { inventoryService } from '../src/services/inventory.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { manufacturingRollbackRepository } from '../src/repositories/manufacturingRollback.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { ManufacturingOrder, ManufacturingOrderItem } from '../src/types/database';

describe('Manufacturing Rollback Integration & Full Compensation Chain (Phase 038)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-rollback-001';
  const finishedProdId = 'prod-fg-001';
  const comp1Id = 'comp-001';
  const warehouseId = 'wh-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  // In-memory mock databases
  let inventoryBalances: Map<string, number>;
  let stockLedger: Array<{ product_id: string; movement_type: string; reference_type: string; quantity: string }>;
  let moStore: Map<string, ManufacturingOrder>;
  let itemStore: Map<string, ManufacturingOrderItem>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

    inventoryBalances = new Map([
      [comp1Id, 100],
      [finishedProdId, 0],
    ]);
    stockLedger = [];

    const mo: ManufacturingOrder = {
      id: moId,
      organization_id: orgAId,
      bom_id: 'bom-001',
      product_id: finishedProdId,
      warehouse_id: warehouseId,
      order_number: 'MO-REV-001',
      mo_number: 'MO-REV-001',
      planned_quantity: '10.0000',
      completed_quantity: '0.0000',
      produced_quantity: '0.0000',
      scheduled_start_date: null,
      scheduled_end_date: null,
      actual_start_date: new Date(),
      actual_end_date: null,
      status: 'in_progress',
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const item: ManufacturingOrderItem = {
      id: 'item-001',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      component_product_id: comp1Id,
      bom_item_id: null,
      required_quantity: '20.0000',
      consumed_quantity: '20.0000', // Material already consumed!
      unit: 'pcs',
      sequence: 1,
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    moStore = new Map([[moId, mo]]);
    itemStore = new Map([[item.id, item]]);

    vi.spyOn(manufacturingRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId) return moStore.get(id) || null;
      return null;
    });

    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId) return moStore.get(id) || null;
      return null;
    });

    vi.spyOn(manufacturingRepository, 'findItemById').mockImplementation(async (orgId, itemId) => {
      if (orgId === orgAId) return itemStore.get(itemId) || null;
      return null;
    });

    vi.spyOn(manufacturingRepository, 'listItems').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === moId) return Array.from(itemStore.values());
      return [];
    });

    vi.spyOn(manufacturingRepository, 'updateItem').mockImplementation(async (orgId, itemId, data) => {
      const existing = itemStore.get(itemId)!;
      const updated = { ...existing, ...data };
      itemStore.set(itemId, updated);
      return updated;
    });

    vi.spyOn(manufacturingRepository, 'update').mockImplementation(async (orgId, id, data) => {
      const existing = moStore.get(id)!;
      const updated = { ...existing, ...data };
      moStore.set(id, updated);
      return updated;
    });

    vi.spyOn(inventoryService, 'increaseStock').mockImplementation(async (input) => {
      const current = inventoryBalances.get(input.product_id) || 0;
      const qty = Number(input.quantity);
      inventoryBalances.set(input.product_id, current + qty);
      stockLedger.push({
        product_id: input.product_id,
        movement_type: 'IN',
        reference_type: input.reference_type,
        quantity: String(input.quantity),
      });
      return {
        id: 'inv-1',
        organization_id: input.organization_id,
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
        quantity: String(inventoryBalances.get(input.product_id)),
        reorder_level: '0.0000',
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    vi.spyOn(inventoryService, 'decreaseStock').mockImplementation(async (input) => {
      const current = inventoryBalances.get(input.product_id) || 0;
      const qty = Number(input.quantity);
      inventoryBalances.set(input.product_id, current - qty);
      stockLedger.push({
        product_id: input.product_id,
        movement_type: 'OUT',
        reference_type: input.reference_type,
        quantity: String(input.quantity),
      });
      return {
        id: 'inv-1',
        organization_id: input.organization_id,
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
        quantity: String(inventoryBalances.get(input.product_id)),
        reorder_level: '0.0000',
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    vi.spyOn(manufacturingRollbackRepository, 'findConsumptionReversalByNumber').mockResolvedValue(null);
    vi.spyOn(manufacturingRollbackRepository, 'findProductionReversalByNumber').mockResolvedValue(null);
    vi.spyOn(manufacturingRollbackRepository, 'createConsumptionReversal').mockResolvedValue({
      id: 'rev-c-1',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      manufacturing_material_consumption_id: null,
      manufacturing_order_item_id: 'item-001',
      product_id: comp1Id,
      warehouse_id: warehouseId,
      reversal_number: 'REV-CON-001',
      quantity: '20.0000',
      reversed_by: null,
      reversed_at: new Date(),
      reason: null,
      created_at: new Date(),
    });
    vi.spyOn(manufacturingRollbackRepository, 'createProductionReversal').mockResolvedValue({
      id: 'rev-p-1',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      manufacturing_production_id: null,
      product_id: finishedProdId,
      warehouse_id: warehouseId,
      reversal_number: 'REV-PROD-001',
      quantity: '5.0000',
      reversed_by: null,
      reversed_at: new Date(),
      reason: null,
      created_at: new Date(),
    });
  });

  it('FULL REVERSAL LIFECYCLE: Reverse material -> Component balance restored -> Reversal record created -> MO item consumed_quantity reduced', async () => {
    const res = await manufacturingRollbackService.reverseMaterialConsumption(orgAId, moId, {
      manufacturing_order_item_id: 'item-001',
      reversal_number: 'REV-CON-001',
      quantity: '20.0000',
    });

    expect(res.new_consumed_quantity).toBe('0.0000');

    // Verify component inventory restored by 20 pcs
    expect(inventoryBalances.get(comp1Id)).toBe(120);

    // Verify stock ledger entry
    const ledgerEntry = stockLedger.find((e) => e.reference_type === 'MANUFACTURING_CONSUMPTION_REVERSAL');
    expect(ledgerEntry).toBeDefined();
    expect(ledgerEntry?.movement_type).toBe('IN');
  });
});
