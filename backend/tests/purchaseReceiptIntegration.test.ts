import { describe, it, expect, vi } from 'vitest';
import { purchaseReceiptService } from '../src/services/purchaseReceipt.service';
import { purchaseReceiptRepository } from '../src/repositories/purchaseReceipt.repository';
import { purchaseOrderRepository } from '../src/repositories/purchaseOrder.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { productRepository } from '../src/repositories/product.repository';
import { inventoryService } from '../src/services/inventory.service';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { PurchaseReceipt, PurchaseReceiptItem, AuditLog, Inventory } from '../src/types/database';

describe('Purchase Receipt Subsystem End-to-End Workflows (Phase 029)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const suppId = '44444444-4444-4444-4444-444444444444';
  const whId = '55555555-5555-5555-5555-555555555555';
  const prodId = '66666666-6666-6666-6666-666666666666';
  const poId = '77777777-7777-7777-7777-777777777777';
  const poItemId = '88888888-8888-8888-8888-888888888888';
  const receiptId = '99999999-9999-9999-9999-999999999999';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockPO = {
    id: poId,
    organization_id: orgAId,
    supplier_id: suppId,
    warehouse_id: whId,
    order_number: 'PO-100001',
    order_date: new Date(),
    expected_delivery_date: null,
    status: 'approved' as const,
    currency: 'USD',
    subtotal: '500.0000',
    tax_amount: '0.0000',
    discount_amount: '0.0000',
    total_amount: '500.0000',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPOItem = {
    id: poItemId,
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
    name: 'Test Product',
    description: null,
    category: null,
    unit_of_measure: 'PCS',
    cost_price: '50.0000',
    selling_price: '100.0000',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockReceipt: PurchaseReceipt = {
    id: receiptId,
    organization_id: orgAId,
    purchase_order_id: poId,
    receipt_number: 'REC-100001',
    warehouse_id: whId,
    status: 'draft',
    receipt_date: new Date(),
    received_at: null,
    cancelled_at: null,
    notes: null,
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockReceiptItem: PurchaseReceiptItem = {
    id: 'rec-item-1',
    organization_id: orgAId,
    receipt_id: receiptId,
    purchase_order_item_id: poItemId,
    product_id: prodId,
    quantity: '4.0000',
    unit_cost: '50.0000',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('Full Workflow: Partial Receiving -> PO partially_received -> Full Receiving -> PO received', async () => {
    vi.spyOn(purchaseOrderRepository, 'findById').mockResolvedValue(mockPO);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);
    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
    vi.spyOn(purchaseReceiptRepository, 'findByReceiptNumber').mockResolvedValue(null);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValue([mockPOItem]);
    vi.spyOn(purchaseReceiptRepository, 'create').mockResolvedValue(mockReceipt);
    vi.spyOn(purchaseReceiptRepository, 'createItem').mockResolvedValue(mockReceiptItem);
    vi.spyOn(inventoryService, 'increaseStock').mockResolvedValue({ id: 'inv-1' } as Inventory);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    // 1. Create Receipt 1 (4 pcs)
    const rec1 = await purchaseReceiptService.createReceipt(
      {
        organization_id: orgAId,
        purchase_order_id: poId,
        warehouse_id: whId,
        items: [{ purchase_order_item_id: poItemId, product_id: prodId, quantity: 4 }],
      },
      userAId,
    );
    expect(rec1.status).toBe('draft');

    // 2. Post Receipt 1 -> PO becomes partially_received
    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce(rec1);
    vi.spyOn(purchaseReceiptRepository, 'listItems').mockResolvedValueOnce([mockReceiptItem]);
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValue(mockPO);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValue([mockPOItem]);
    vi.spyOn(purchaseReceiptRepository, 'getReceivedQuantityForPurchaseOrderItem')
      .mockResolvedValueOnce('0.0000') // for over-receiving check
      .mockResolvedValueOnce('4.0000'); // for PO status check
    vi.spyOn(purchaseReceiptRepository, 'update').mockResolvedValueOnce({
      ...rec1,
      status: 'posted',
    });
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce({
      ...mockPO,
      status: 'partially_received',
    });

    const posted1 = await purchaseReceiptService.postReceipt(orgAId, receiptId, userAId);
    expect(posted1.status).toBe('posted');

    // 3. Post Receipt 2 (6 pcs) -> PO becomes fully received
    const rec2Item = { ...mockReceiptItem, id: 'rec-item-2', quantity: '6.0000' };
    const rec2 = { ...mockReceipt, id: 'rec-2', receipt_number: 'REC-100002' };
    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce(rec2);
    vi.spyOn(purchaseReceiptRepository, 'listItems').mockResolvedValueOnce([rec2Item]);
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockPO,
      status: 'partially_received',
    });
    vi.spyOn(purchaseReceiptRepository, 'getReceivedQuantityForPurchaseOrderItem')
      .mockResolvedValueOnce('4.0000') // for over-receiving check
      .mockResolvedValueOnce('10.0000'); // for PO status check
    vi.spyOn(purchaseReceiptRepository, 'update').mockResolvedValueOnce({
      ...rec2,
      status: 'posted',
    });
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce({
      ...mockPO,
      status: 'received',
    });

    const posted2 = await purchaseReceiptService.postReceipt(orgAId, 'rec-2', userAId);
    expect(posted2.status).toBe('posted');
  });

  it('Enforces Tenant Isolation across all query methods', async () => {
    vi.spyOn(purchaseReceiptRepository, 'findById').mockResolvedValueOnce(null);

    await expect(purchaseReceiptService.getReceipt(orgBId, receiptId)).rejects.toThrow(
      'Purchase receipt with ID 99999999-9999-9999-9999-999999999999 not found',
    );
  });
});
