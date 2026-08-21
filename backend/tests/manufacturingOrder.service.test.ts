import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingOrderService } from '../src/services/manufacturingOrder.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { productRepository } from '../src/repositories/product.repository';
import { bomRepository } from '../src/repositories/bom.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { bomExplosionService } from '../src/services/bomExplosion.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import {
  ProductNotFoundError,
  ManufacturingOrderWarehouseNotFoundError,
  ManufacturingOrderBomNotFoundError,
  ManufacturingOrderBomInactiveError,
  ManufacturingOrderProductMismatchError,
  DuplicateManufacturingOrderNumberError,
  InvalidManufacturingOrderQuantityError,
  ManufacturingOrderImmutableError,
} from '../src/types';
import { Product, Warehouse, Bom, ManufacturingOrder } from '../src/types/database';

describe('Manufacturing Order Service Unit Tests (Phase 033)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const productId = 'prod-finished-001';
  const bomId = 'bom-001';
  const warehouseId = 'wh-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const mockProduct: Product = {
    id: productId,
    organization_id: orgId,
    name: 'Finished Table',
    sku: 'TABLE-001',
    description: null,
    uom: 'pcs',
    category: 'Furniture',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockWarehouse: Warehouse = {
    id: warehouseId,
    organization_id: orgId,
    name: 'Main Assembly Plant',
    code: 'PLANT-01',
    location: 'Building A',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBom: Bom = {
    id: bomId,
    organization_id: orgId,
    product_id: productId,
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

  const mockMo: ManufacturingOrder = {
    id: 'mo-001',
    organization_id: orgId,
    bom_id: bomId,
    product_id: productId,
    warehouse_id: warehouseId,
    order_number: 'MO-2026-0001',
    mo_number: 'MO-2026-0001',
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
  });

  describe('createOrder', () => {
    it('should successfully create MO with exploded component requirements', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);
      vi.spyOn(bomRepository, 'findById').mockResolvedValue(mockBom);
      vi.spyOn(manufacturingRepository, 'findByOrderNumber').mockResolvedValue(null);
      vi.spyOn(bomExplosionService, 'explodeBom').mockResolvedValue({
        product_id: productId,
        product_code: 'TABLE-001',
        bom_id: bomId,
        planned_quantity: '10.0000',
        exploded_at: new Date().toISOString(),
        components: [
          {
            product_id: 'comp-leg',
            product_code: 'LEG-001',
            product_name: 'Table Leg',
            unit_of_measure: 'pcs',
            required_quantity: '40.0000',
            scrap_percentage: '0.00',
            level: 1,
            path: ['TABLE-001', 'LEG-001'],
          },
        ],
      });
      vi.spyOn(manufacturingRepository, 'create').mockResolvedValue(mockMo);
      vi.spyOn(manufacturingRepository, 'createItem').mockResolvedValue({
        id: 'item-leg',
        organization_id: orgId,
        manufacturing_order_id: 'mo-001',
        component_product_id: 'comp-leg',
        bom_item_id: null,
        required_quantity: '40.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const order = await manufacturingOrderService.createOrder({
        organization_id: orgId,
        product_id: productId,
        bom_id: bomId,
        warehouse_id: warehouseId,
        planned_quantity: 10,
      });

      expect(order.id).toBe('mo-001');
      expect(order.items.length).toBe(1);
      expect(order.items[0]!.required_quantity).toBe('40.0000');
    });

    it('should throw ProductNotFoundError if product does not exist', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(null);

      await expect(
        manufacturingOrderService.createOrder({
          organization_id: orgId,
          product_id: 'invalid-prod',
          bom_id: bomId,
          warehouse_id: warehouseId,
          planned_quantity: 10,
        }),
      ).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw ManufacturingOrderWarehouseNotFoundError if warehouse does not exist', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(null);

      await expect(
        manufacturingOrderService.createOrder({
          organization_id: orgId,
          product_id: productId,
          bom_id: bomId,
          warehouse_id: 'invalid-wh',
          planned_quantity: 10,
        }),
      ).rejects.toThrow(ManufacturingOrderWarehouseNotFoundError);
    });

    it('should throw ManufacturingOrderBomNotFoundError if BOM does not exist', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);
      vi.spyOn(bomRepository, 'findById').mockResolvedValue(null);

      await expect(
        manufacturingOrderService.createOrder({
          organization_id: orgId,
          product_id: productId,
          bom_id: 'invalid-bom',
          warehouse_id: warehouseId,
          planned_quantity: 10,
        }),
      ).rejects.toThrow(ManufacturingOrderBomNotFoundError);
    });

    it('should throw ManufacturingOrderBomInactiveError if BOM is draft or inactive', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);
      vi.spyOn(bomRepository, 'findById').mockResolvedValue({ ...mockBom, status: 'draft' });

      await expect(
        manufacturingOrderService.createOrder({
          organization_id: orgId,
          product_id: productId,
          bom_id: bomId,
          warehouse_id: warehouseId,
          planned_quantity: 10,
        }),
      ).rejects.toThrow(ManufacturingOrderBomInactiveError);
    });

    it('should throw ManufacturingOrderProductMismatchError if BOM product does not match requested product', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);
      vi.spyOn(bomRepository, 'findById').mockResolvedValue({ ...mockBom, product_id: 'other-prod' });

      await expect(
        manufacturingOrderService.createOrder({
          organization_id: orgId,
          product_id: productId,
          bom_id: bomId,
          warehouse_id: warehouseId,
          planned_quantity: 10,
        }),
      ).rejects.toThrow(ManufacturingOrderProductMismatchError);
    });

    it('should throw DuplicateManufacturingOrderNumberError if MO number already exists', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);
      vi.spyOn(bomRepository, 'findById').mockResolvedValue(mockBom);
      vi.spyOn(manufacturingRepository, 'findByOrderNumber').mockResolvedValue(mockMo);

      await expect(
        manufacturingOrderService.createOrder({
          organization_id: orgId,
          product_id: productId,
          bom_id: bomId,
          warehouse_id: warehouseId,
          mo_number: 'MO-2026-0001',
          planned_quantity: 10,
        }),
      ).rejects.toThrow(DuplicateManufacturingOrderNumberError);
    });

    it('should throw InvalidManufacturingOrderQuantityError for zero or negative quantity', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);
      vi.spyOn(bomRepository, 'findById').mockResolvedValue(mockBom);

      await expect(
        manufacturingOrderService.createOrder({
          organization_id: orgId,
          product_id: productId,
          bom_id: bomId,
          warehouse_id: warehouseId,
          planned_quantity: 0,
        }),
      ).rejects.toThrow(InvalidManufacturingOrderQuantityError);
    });
  });

  describe('updateOrder', () => {
    it('should reject modification if MO is not in DRAFT status', async () => {
      vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({
        ...mockMo,
        status: 'confirmed',
      });

      await expect(
        manufacturingOrderService.updateOrder(orgId, 'mo-001', { planned_quantity: 20 }),
      ).rejects.toThrow(ManufacturingOrderImmutableError);
    });
  });
});
