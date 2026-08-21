import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingOrderService } from '../src/services/manufacturingOrder.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { productRepository } from '../src/repositories/product.repository';
import { bomRepository } from '../src/repositories/bom.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { inventoryService } from '../src/services/inventory.service';
import { componentAvailabilityService } from '../src/services/componentAvailability.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { Product, Warehouse, Bom, ManufacturingOrder, ManufacturingOrderItem } from '../src/types/database';

describe('Manufacturing Order Integration & Safety Verification (Phase 033)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const finishedProdId = 'prod-table-001';
  const compWoodId = 'prod-wood-001';
  const compScrewId = 'prod-screw-001';
  const bomId = 'bom-table-001';
  const warehouseId = 'wh-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const finishedProd: Product = {
    id: finishedProdId,
    organization_id: orgAId,
    name: 'Wooden Table',
    sku: 'TABLE-001',
    description: null,
    uom: 'pcs',
    category: 'Furniture',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const compWood: Product = {
    id: compWoodId,
    organization_id: orgAId,
    name: 'Wood Plank',
    sku: 'WOOD-001',
    description: null,
    uom: 'pcs',
    category: 'Raw Materials',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const compScrew: Product = {
    id: compScrewId,
    organization_id: orgAId,
    name: 'Screw',
    sku: 'SCREW-001',
    description: null,
    uom: 'pcs',
    category: 'Hardware',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const warehouse: Warehouse = {
    id: warehouseId,
    organization_id: orgAId,
    name: 'Central Factory',
    code: 'FACTORY-1',
    location: 'Zone 1',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const bom: Bom = {
    id: bomId,
    organization_id: orgAId,
    product_id: finishedProdId,
    bom_number: 'BOM-TABLE-001',
    version: 1,
    status: 'active',
    is_default: true,
    effective_from: null,
    effective_to: null,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const bomItems = [
    {
      id: 'item-wood',
      bom_id: bomId,
      component_product_id: compWoodId,
      quantity: '4.0000',
      scrap_percentage: '0.00',
      sequence: 1,
    },
    {
      id: 'item-screw',
      bom_id: bomId,
      component_product_id: compScrewId,
      quantity: '16.0000',
      scrap_percentage: '0.00',
      sequence: 2,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
    vi.spyOn(componentAvailabilityService, 'checkManufacturingOrderAvailability').mockResolvedValue({
      manufacturing_order_id: 'mo-integration-001',
      warehouse_id: warehouseId,
      status: 'READY',
      ready: true,
      components: [],
      total_components: 0,
      available_components: 0,
      shortage_components: 0,
    });

    vi.spyOn(productRepository, 'findById').mockImplementation(async (orgId, pId) => {
      if (orgId !== orgAId) return null;
      if (pId === finishedProdId) return finishedProd;
      if (pId === compWoodId) return compWood;
      if (pId === compScrewId) return compScrew;
      return null;
    });

    vi.spyOn(warehouseRepository, 'findById').mockImplementation(async (orgId, wId) => {
      if (orgId !== orgAId || wId !== warehouseId) return null;
      return warehouse;
    });

    vi.spyOn(bomRepository, 'findById').mockImplementation(async (orgId, bId) => {
      if (orgId !== orgAId || bId !== bomId) return null;
      return bom;
    });

    vi.spyOn(bomRepository, 'findDefaultBom').mockImplementation(async (orgId, pId) => {
      if (orgId !== orgAId || pId !== finishedProdId) return null;
      return bom;
    });

    vi.spyOn(bomRepository, 'findByProductId').mockImplementation(async (orgId, pId) => {
      if (orgId !== orgAId || pId !== finishedProdId) return [];
      return [bom];
    });

    vi.spyOn(bomRepository, 'findByIdWithComponents').mockImplementation(async (orgId, bId) => {
      if (orgId !== orgAId || bId !== bomId) return null;
      return {
        ...bom,
        items: bomItems.map((bi) => ({
          ...bi,
          organization_id: orgAId,
          unit_of_measure: 'pcs',
          created_at: new Date(),
          updated_at: new Date(),
        })),
      };
    });
  });

  it('TEST 18 — CRITICAL INVENTORY SAFETY BOUNDARY: MO Lifecycle MUST NOT touch inventory', async () => {
    // Spies on Inventory & Ledger Services
    const increaseStockSpy = vi.spyOn(inventoryService, 'increaseStock');
    const decreaseStockSpy = vi.spyOn(inventoryService, 'decreaseStock');
    const adjustStockSpy = vi.spyOn(inventoryService, 'adjustStock');

    const moStore: Map<string, ManufacturingOrder> = new Map();
    const itemStore: Map<string, ManufacturingOrderItem[]> = new Map();

    vi.spyOn(manufacturingRepository, 'create').mockImplementation(async (data) => {
      const order: ManufacturingOrder = {
        id: 'mo-integration-001',
        organization_id: data.organization_id,
        bom_id: data.bom_id,
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        order_number: data.order_number || 'MO-2026-0001',
        mo_number: data.mo_number || data.order_number || 'MO-2026-0001',
        planned_quantity: String(data.planned_quantity),
        completed_quantity: '0.0000',
        scheduled_start_date: null,
        scheduled_end_date: null,
        actual_start_date: null,
        actual_end_date: null,
        status: data.status || 'draft',
        notes: data.notes || null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      moStore.set(order.id, order);
      return order;
    });

    vi.spyOn(manufacturingRepository, 'createItem').mockImplementation(async (data) => {
      const item: ManufacturingOrderItem = {
        id: `item-${data.sequence}`,
        organization_id: data.organization_id,
        manufacturing_order_id: data.manufacturing_order_id,
        component_product_id: data.component_product_id,
        bom_item_id: data.bom_item_id || null,
        required_quantity: String(data.required_quantity),
        consumed_quantity: '0.0000',
        unit: data.unit || 'pcs',
        sequence: data.sequence || 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const existing = itemStore.get(data.manufacturing_order_id) || [];
      existing.push(item);
      itemStore.set(data.manufacturing_order_id, existing);
      return item;
    });

    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockImplementation(async (orgId, id) => {
      const mo = moStore.get(id);
      return mo && mo.organization_id === orgId ? { ...mo } : null;
    });

    vi.spyOn(manufacturingRepository, 'listItems').mockImplementation(async (orgId, id) => {
      const items = itemStore.get(id) || [];
      return items.filter((i) => i.organization_id === orgId);
    });

    vi.spyOn(manufacturingRepository, 'update').mockImplementation(async (orgId, id, data) => {
      const mo = moStore.get(id);
      if (!mo || mo.organization_id !== orgId) return null;
      const updated: ManufacturingOrder = {
        ...mo,
        ...data,
        status: (data.status as ManufacturingOrder['status']) || mo.status,
        updated_at: new Date(),
      };
      moStore.set(id, updated);
      return updated;
    });

    // 1. Create MO (DRAFT)
    const mo = await manufacturingOrderService.createOrder({
      organization_id: orgAId,
      product_id: finishedProdId,
      bom_id: bomId,
      warehouse_id: warehouseId,
      planned_quantity: 10,
    });
    expect(mo.status).toBe('draft');
    expect(mo.items.length).toBe(2);

    // 2. Confirm
    const confirmed = await manufacturingOrderService.confirmOrder(orgAId, mo.id);
    expect(confirmed.status).toBe('confirmed');

    // 3. Plan
    const planned = await manufacturingOrderService.planOrder(orgAId, mo.id);
    expect(planned.status).toBe('planned');

    // 4. Release
    const released = await manufacturingOrderService.releaseOrder(orgAId, mo.id);
    expect(released.status).toBe('released');

    // 5. Start
    const started = await manufacturingOrderService.startOrder(orgAId, mo.id);
    expect(started.status).toBe('in_progress');

    // 6. Complete
    const currentMo = moStore.get(mo.id)!;
    moStore.set(mo.id, { ...currentMo, produced_quantity: '10.0000', completed_quantity: '10.0000' });
    const completed = await manufacturingOrderService.completeOrder(orgAId, mo.id);
    expect(completed.status).toBe('completed');

    // VERIFY SAFETY BOUNDARY: 0 inventory calls across the entire lifecycle!
    expect(increaseStockSpy).not.toHaveBeenCalled();
    expect(decreaseStockSpy).not.toHaveBeenCalled();
    expect(adjustStockSpy).not.toHaveBeenCalled();
  });

  it('TEST 16 — Tenant Isolation Enforcement', async () => {
    vi.spyOn(manufacturingRepository, 'findByIdWithItems').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === 'mo-001') {
        return {
          id: 'mo-001',
          organization_id: orgAId,
          bom_id: bomId,
          product_id: finishedProdId,
          warehouse_id: warehouseId,
          order_number: 'MO-001',
          mo_number: 'MO-001',
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
          items: [],
        };
      }
      return null;
    });

    await expect(manufacturingOrderService.getOrder(orgBId, 'mo-001')).rejects.toThrow();
  });
});
