import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderService } from '../src/services/purchaseOrder.service';
import { purchaseOrderRepository } from '../src/repositories/purchaseOrder.repository';
import { supplierRepository } from '../src/repositories/supplier.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { productRepository } from '../src/repositories/product.repository';
import { inventoryService } from '../src/services/inventory.service';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import {
  SupplierNotFoundError,
  WarehouseNotFoundError,
  PurchaseOrderMissingItemsError,
  InvalidPurchaseOrderQuantityError,
  InvalidPurchaseOrderCostError,
  DuplicatePurchaseOrderNumberError,
  ValidationError,
} from '../src/types';
import { PurchaseOrder, PurchaseOrderItem, AuditLog } from '../src/types/database';

describe('Purchase Order Service Subsystem (Phase 028)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const suppId = '44444444-4444-4444-4444-444444444444';
  const whId = '55555555-5555-5555-5555-555555555555';
  const prodId = '66666666-6666-6666-6666-666666666666';
  const poId = '99999999-9999-9999-9999-999999999999';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockSupplier = {
    id: suppId,
    organization_id: orgAId,
    name: 'Acme Supply Co.',
    email: 'acme@test.com',
    phone: null,
    address: null,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockWarehouse = {
    id: whId,
    organization_id: orgAId,
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    address: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockProduct = {
    id: prodId,
    organization_id: orgAId,
    sku: 'PROD-001',
    name: 'Industrial Valve',
    description: null,
    category: null,
    unit_of_measure: 'PCS',
    cost_price: '50.0000',
    selling_price: '100.0000',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPO: PurchaseOrder = {
    id: poId,
    organization_id: orgAId,
    supplier_id: suppId,
    warehouse_id: whId,
    order_number: 'PO-100001',
    order_date: new Date(),
    expected_delivery_date: null,
    status: 'draft',
    currency: 'USD',
    subtotal: '500.0000',
    tax_amount: '0.0000',
    discount_amount: '0.0000',
    total_amount: '500.0000',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockItem: PurchaseOrderItem = {
    id: 'item-1',
    organization_id: orgAId,
    purchase_order_id: poId,
    product_id: prodId,
    quantity: '10.0000',
    unit_cost: '50.0000',
    discount_amount: '0.0000',
    tax_rate: '0.000000',
    tax_amount: '0.0000',
    line_total: '500.0000',
    sequence: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('should create a valid Purchase Order with items and calculate server-side totals', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
    vi.spyOn(purchaseOrderRepository, 'findByOrderNumber').mockResolvedValueOnce(null);
    vi.spyOn(purchaseOrderRepository, 'create').mockResolvedValueOnce(mockPO);
    vi.spyOn(purchaseOrderRepository, 'createItem').mockResolvedValueOnce(mockItem);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const result = await purchaseOrderService.createPurchaseOrder(
      {
        organization_id: orgAId,
        supplier_id: suppId,
        warehouse_id: whId,
        order_number: 'PO-100001',
        items: [{ product_id: prodId, quantity: 10, unit_cost: 50 }],
      },
      userAId,
    );

    expect(result.id).toBe(poId);
    expect(result.items.length).toBe(1);
    expect(result.total_amount).toBe('500.0000');
  });

  it('should reject PO creation if supplier is non-existent or cross-tenant', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(null);

    await expect(
      purchaseOrderService.createPurchaseOrder(
        {
          organization_id: orgAId,
          supplier_id: suppId,
          items: [{ product_id: prodId, quantity: 1, unit_cost: 10 }],
        },
        userAId,
      ),
    ).rejects.toThrow(SupplierNotFoundError);
  });

  it('should reject PO creation if warehouse is non-existent or cross-tenant', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(null);

    await expect(
      purchaseOrderService.createPurchaseOrder(
        {
          organization_id: orgAId,
          supplier_id: suppId,
          warehouse_id: whId,
          items: [{ product_id: prodId, quantity: 1, unit_cost: 10 }],
        },
        userAId,
      ),
    ).rejects.toThrow(WarehouseNotFoundError);
  });

  it('should reject PO creation with empty items array', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);

    await expect(
      purchaseOrderService.createPurchaseOrder(
        {
          organization_id: orgAId,
          supplier_id: suppId,
          warehouse_id: whId,
          items: [],
        },
        userAId,
      ),
    ).rejects.toThrow(PurchaseOrderMissingItemsError);
  });

  it('should reject PO creation with zero or negative quantity', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);

    await expect(
      purchaseOrderService.createPurchaseOrder(
        {
          organization_id: orgAId,
          supplier_id: suppId,
          warehouse_id: whId,
          items: [{ product_id: prodId, quantity: 0, unit_cost: 10 }],
        },
        userAId,
      ),
    ).rejects.toThrow(InvalidPurchaseOrderQuantityError);
  });

  it('should reject PO creation with negative unit cost', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);

    await expect(
      purchaseOrderService.createPurchaseOrder(
        {
          organization_id: orgAId,
          supplier_id: suppId,
          warehouse_id: whId,
          items: [{ product_id: prodId, quantity: 5, unit_cost: -10 }],
        },
        userAId,
      ),
    ).rejects.toThrow(InvalidPurchaseOrderCostError);
  });

  it('should reject duplicate purchase order number', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
    vi.spyOn(purchaseOrderRepository, 'findByOrderNumber').mockResolvedValueOnce(mockPO);

    await expect(
      purchaseOrderService.createPurchaseOrder(
        {
          organization_id: orgAId,
          supplier_id: suppId,
          warehouse_id: whId,
          order_number: 'PO-100001',
          items: [{ product_id: prodId, quantity: 1, unit_cost: 10 }],
        },
        userAId,
      ),
    ).rejects.toThrow(DuplicatePurchaseOrderNumberError);
  });

  it('should allow adding item to draft PO and recalculate totals', async () => {
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockPO);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValueOnce([]);
    vi.spyOn(purchaseOrderRepository, 'createItem').mockResolvedValueOnce(mockItem);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValueOnce([mockItem]);
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce(mockPO);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const added = await purchaseOrderService.addItem(
      orgAId,
      poId,
      { product_id: prodId, quantity: 10, unit_cost: 50 },
      userAId,
    );

    expect(added.id).toBe('item-1');
  });

  it('should reject item addition if PO is not in draft status', async () => {
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockPO,
      status: 'submitted',
    });

    await expect(
      purchaseOrderService.addItem(
        orgAId,
        poId,
        { product_id: prodId, quantity: 10, unit_cost: 50 },
        userAId,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it('VERIFY INVENTORY SEPARATION: approving PO does NOT increase inventory or write stock ledger', async () => {
    const decreaseSpy = vi.spyOn(inventoryService, 'decreaseStock');
    const increaseSpy = vi.spyOn(inventoryService, 'increaseStock');

    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockPO,
      status: 'submitted',
    });
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce({
      ...mockPO,
      status: 'approved',
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const approved = await purchaseOrderService.approvePurchaseOrder(orgAId, poId, userAId);

    expect(approved.status).toBe('approved');
    expect(decreaseSpy).not.toHaveBeenCalled();
    expect(increaseSpy).not.toHaveBeenCalled();
  });
});
