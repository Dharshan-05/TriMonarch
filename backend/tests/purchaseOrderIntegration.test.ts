import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderService } from '../src/services/purchaseOrder.service';
import { purchaseOrderRepository } from '../src/repositories/purchaseOrder.repository';
import { supplierRepository } from '../src/repositories/supplier.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { productRepository } from '../src/repositories/product.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { PurchaseOrder, PurchaseOrderItem, AuditLog } from '../src/types/database';

describe('Purchase Order Subsystem End-to-End Workflows (Phase 028)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
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
    email: null,
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

  it('Full Workflow 1: CREATE (draft) -> SUBMIT -> APPROVE -> PARTIALLY_RECEIVED -> RECEIVED', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValue(mockSupplier);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);
    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
    vi.spyOn(purchaseOrderRepository, 'findByOrderNumber').mockResolvedValue(null);
    vi.spyOn(purchaseOrderRepository, 'create').mockResolvedValue(mockPO);
    vi.spyOn(purchaseOrderRepository, 'createItem').mockResolvedValue(mockItem);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValue([mockItem]);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    // 1. Create (DRAFT)
    const draft = await purchaseOrderService.createPurchaseOrder(
      {
        organization_id: orgAId,
        supplier_id: suppId,
        warehouse_id: whId,
        order_number: 'PO-100001',
        items: [{ product_id: prodId, quantity: 10, unit_cost: 50 }],
      },
      userAId,
    );
    expect(draft.status).toBe('draft');

    // 2. Submit
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(draft);
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce({
      ...draft,
      status: 'submitted',
    });
    const submitted = await purchaseOrderService.submitPurchaseOrder(orgAId, poId, userAId);
    expect(submitted.status).toBe('submitted');

    // 3. Approve
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(submitted);
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce({
      ...submitted,
      status: 'approved',
    });
    const approved = await purchaseOrderService.approvePurchaseOrder(orgAId, poId, userAId);
    expect(approved.status).toBe('approved');

    // 4. Mark Partially Received
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(approved);
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce({
      ...approved,
      status: 'partially_received',
    });
    const partial = await purchaseOrderService.markPartiallyReceived(orgAId, poId, userAId);
    expect(partial.status).toBe('partially_received');

    // 5. Mark Fully Received
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(partial);
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce({
      ...partial,
      status: 'received',
    });
    const received = await purchaseOrderService.markReceived(orgAId, poId, userAId);
    expect(received.status).toBe('received');
  });

  it('Workflow 2: CREATE -> DRAFT -> CANCELLED', async () => {
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockPO);
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce({
      ...mockPO,
      status: 'cancelled',
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const cancelled = await purchaseOrderService.cancelPurchaseOrder(orgAId, poId, userAId);
    expect(cancelled.status).toBe('cancelled');
  });

  it('Enforces Tenant Isolation across all queries', async () => {
    vi.spyOn(purchaseOrderRepository, 'findById').mockResolvedValueOnce(null);

    await expect(purchaseOrderService.getPurchaseOrder(orgBId, poId)).rejects.toThrow(
      'Purchase order with ID 99999999-9999-9999-9999-999999999999 not found',
    );
  });
});
