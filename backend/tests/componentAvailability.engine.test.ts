import { describe, it, expect, vi, beforeEach } from 'vitest';
import { componentAvailabilityEngine } from '../src/services/componentAvailability.engine';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { inventoryRepository } from '../src/repositories/inventory.repository';
import { stockReservationRepository } from '../src/repositories/stockReservation.repository';
import { productRepository } from '../src/repositories/product.repository';
import { ManufacturingOrder } from '../src/types/database';

describe('Component Availability Engine (Phase 035)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const wh1Id = 'wh-001';
  const wh2Id = 'wh-002';
  const moId = 'mo-001';
  const prodAId = 'prod-comp-a';

  const baseMo: ManufacturingOrder = {
    id: moId,
    organization_id: orgAId,
    bom_id: 'bom-001',
    product_id: 'prod-fg-001',
    warehouse_id: wh1Id,
    order_number: 'MO-001',
    mo_number: 'MO-001',
    planned_quantity: '10.0000',
    completed_quantity: '0.0000',
    scheduled_start_date: null,
    scheduled_end_date: null,
    actual_start_date: null,
    actual_end_date: null,
    status: 'released',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST 1 — All components available (ready = true)', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockResolvedValue(baseMo);
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgAId,
        manufacturing_order_id: moId,
        component_product_id: prodAId,
        bom_item_id: null,
        required_quantity: '10.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    vi.spyOn(productRepository, 'findById').mockResolvedValue({
      id: prodAId,
      organization_id: orgAId,
      sku: 'COMP-A',
      name: 'Component A',
      type: 'raw_material',
      uom: 'pcs',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValue({
      id: 'inv-1',
      organization_id: orgAId,
      product_id: prodAId,
      warehouse_id: wh1Id,
      quantity: '20.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValue('5.0000');

    const result = await componentAvailabilityEngine.calculateAvailability(orgAId, moId);

    expect(result.ready).toBe(true);
    expect(result.status).toBe('READY');
    expect(result.components.length).toBe(1);
    expect(result.components[0]!.available).toBe(true);
    expect(result.components[0]!.available_quantity).toBe('15.0000');
    expect(result.components[0]!.shortage_quantity).toBe('0.0000');
  });

  it('TEST 2 — One component shortage (Required = 100, On hand = 40, Reserved = 10, Available = 30, Shortage = 70)', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockResolvedValue(baseMo);
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgAId,
        manufacturing_order_id: moId,
        component_product_id: prodAId,
        bom_item_id: null,
        required_quantity: '100.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValue({
      id: 'inv-1',
      organization_id: orgAId,
      product_id: prodAId,
      warehouse_id: wh1Id,
      quantity: '40.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValue('10.0000');

    const result = await componentAvailabilityEngine.calculateAvailability(orgAId, moId);

    expect(result.ready).toBe(false);
    expect(result.status).toBe('SHORTAGE');
    expect(result.components[0]!.available).toBe(false);
    expect(result.components[0]!.available_quantity).toBe('30.0000');
    expect(result.components[0]!.shortage_quantity).toBe('70.0000');
    expect(result.shortage_components).toBe(1);
  });

  it('TEST 3 — Reserved stock reduces availability (Required = 50, On hand = 100, Reserved = 60, Available = 40, Shortage = 10)', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockResolvedValue(baseMo);
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgAId,
        manufacturing_order_id: moId,
        component_product_id: prodAId,
        bom_item_id: null,
        required_quantity: '50.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValue({
      id: 'inv-1',
      organization_id: orgAId,
      product_id: prodAId,
      warehouse_id: wh1Id,
      quantity: '100.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValue('60.0000');

    const result = await componentAvailabilityEngine.calculateAvailability(orgAId, moId);

    expect(result.ready).toBe(false);
    expect(result.components[0]!.available_quantity).toBe('40.0000');
    expect(result.components[0]!.shortage_quantity).toBe('10.0000');
  });

  it('TEST 6 — Multiple requirement rows for same product aggregate correctly', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockResolvedValue(baseMo);
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgAId,
        manufacturing_order_id: moId,
        component_product_id: prodAId,
        bom_item_id: null,
        required_quantity: '10.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'item-2',
        organization_id: orgAId,
        manufacturing_order_id: moId,
        component_product_id: prodAId,
        bom_item_id: null,
        required_quantity: '5.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValue({
      id: 'inv-1',
      organization_id: orgAId,
      product_id: prodAId,
      warehouse_id: wh1Id,
      quantity: '20.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValue('0.0000');

    const result = await componentAvailabilityEngine.calculateAvailability(orgAId, moId);

    expect(result.components.length).toBe(1);
    expect(result.components[0]!.required_quantity).toBe('15.0000');
    expect(result.components[0]!.available).toBe(true);
  });

  it('TEST 7 — Warehouse Isolation: Inventory in WH-002 does NOT satisfy WH-001 requirement', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockResolvedValue(baseMo); // WH-001
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgAId,
        manufacturing_order_id: moId,
        component_product_id: prodAId,
        bom_item_id: null,
        required_quantity: '50.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Inventory query is strictly scoped to wh1Id
    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockImplementation(async (orgId, pId, wId) => {
      if (wId === wh1Id) return null; // No inventory in WH-001
      if (wId === wh2Id) {
        return {
          id: 'inv-wh2',
          organization_id: orgId,
          product_id: pId,
          warehouse_id: wh2Id,
          quantity: '100.0000',
          reorder_level: '0.0000',
          created_at: new Date(),
          updated_at: new Date(),
        };
      }
      return null;
    });

    vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValue('0.0000');

    const result = await componentAvailabilityEngine.calculateAvailability(orgAId, moId);

    expect(result.ready).toBe(false);
    expect(result.components[0]!.on_hand_quantity).toBe('0.0000');
    expect(result.components[0]!.shortage_quantity).toBe('50.0000');
  });

  it('TEST 8 & 9 — Tenant Isolation & No Inventory Record (on-hand = 0)', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockImplementation(async (orgId, _id) => {
      if (orgId === orgAId) return baseMo;
      return null;
    });
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgAId,
        manufacturing_order_id: moId,
        component_product_id: prodAId,
        bom_item_id: null,
        required_quantity: '10.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValue(null);
    vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValue('0.0000');

    // Org A gets availability result with on_hand = 0
    const resA = await componentAvailabilityEngine.calculateAvailability(orgAId, moId);
    expect(resA.components[0]!.on_hand_quantity).toBe('0.0000');
    expect(resA.components[0]!.shortage_quantity).toBe('10.0000');

    // Org B gets not found error
    await expect(componentAvailabilityEngine.calculateAvailability(orgBId, moId)).rejects.toThrow();
  });

  it('TEST 10 & 11 — Exact Decimal Precision & Small Decimal Shortage', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockResolvedValue(baseMo);
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgAId,
        manufacturing_order_id: moId,
        component_product_id: prodAId,
        bom_item_id: null,
        required_quantity: '10.1251',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValue({
      id: 'inv-1',
      organization_id: orgAId,
      product_id: prodAId,
      warehouse_id: wh1Id,
      quantity: '10.1250',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValue('0.0000');

    const result = await componentAvailabilityEngine.calculateAvailability(orgAId, moId);

    expect(result.ready).toBe(false);
    expect(result.components[0]!.shortage_quantity).toBe('0.0001');
  });
});
