import { describe, it, expect, vi } from 'vitest';
import { purchaseReceiptService } from '../src/services/purchaseReceipt.service';
import { purchaseReceiptRepository } from '../src/repositories/purchaseReceipt.repository';
import { purchaseOrderRepository } from '../src/repositories/purchaseOrder.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { productRepository } from '../src/repositories/product.repository';
import { inventoryService } from '../src/services/inventory.service';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  OverReceivingError,
  PurchaseReceiptAlreadyPostedError,
} from '../src/types';
import { PoolClient } from 'pg';
import { PurchaseReceipt, PurchaseReceiptItem, AuditLog, Inventory } from '../src/types/database';

describe('Purchase Receipt Service Subsystem (Phase 029)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
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
    quantity: '10.0000',
    unit_cost: '50.0000',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('VERIFY DRAFT CREATION: creating a draft receipt DOES NOT alter physical inventory', async () => {
    const increaseSpy = vi.spyOn(inventoryService, 'increaseStock');

    vi.spyOn(purchaseOrderRepository, 'findById').mockResolvedValueOnce(mockPO);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
    vi.spyOn(purchaseReceiptRepository, 'findByReceiptNumber').mockResolvedValueOnce(null);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValueOnce([mockPOItem]);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
    vi.spyOn(purchaseReceiptRepository, 'create').mockResolvedValueOnce(mockReceipt);
    vi.spyOn(purchaseReceiptRepository, 'createItem').mockResolvedValueOnce(mockReceiptItem);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const created = await purchaseReceiptService.createReceipt(
      {
        organization_id: orgAId,
        purchase_order_id: poId,
        warehouse_id: whId,
        items: [{ purchase_order_item_id: poItemId, product_id: prodId, quantity: 10 }],
      },
      userAId,
    );

    expect(created.status).toBe('draft');
    expect(increaseSpy).not.toHaveBeenCalled();
  });

  it('POST RECEIPT: posting receipt increases physical stock and creates stock ledger IN entry', async () => {
    const increaseSpy = vi
      .spyOn(inventoryService, 'increaseStock')
      .mockResolvedValueOnce({ id: 'inv-1' } as Inventory);

    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockReceipt);
    vi.spyOn(purchaseReceiptRepository, 'listItems').mockResolvedValueOnce([mockReceiptItem]);
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValue(mockPO);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValueOnce([mockPOItem]);
    vi.spyOn(purchaseReceiptRepository, 'getReceivedQuantityForPurchaseOrderItem').mockResolvedValue('0.0000');
    vi.spyOn(purchaseReceiptRepository, 'update').mockResolvedValueOnce({
      ...mockReceipt,
      status: 'posted',
      received_at: new Date(),
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const posted = await purchaseReceiptService.postReceipt(orgAId, receiptId, userAId);

    expect(posted.status).toBe('posted');
    expect(increaseSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '10.0000',
        reference_type: 'PURCHASE_RECEIPT',
        reference_id: receiptId,
      }),
      userAId,
      undefined,
    );
  });

  it('OVER-RECEIVING: rejects receiving quantity greater than remaining receivable quantity', async () => {
    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockReceipt);
    vi.spyOn(purchaseReceiptRepository, 'listItems').mockResolvedValueOnce([
      { ...mockReceiptItem, quantity: '15.0000' },
    ]);
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockPO);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValueOnce([mockPOItem]);
    vi.spyOn(purchaseReceiptRepository, 'getReceivedQuantityForPurchaseOrderItem').mockResolvedValue('0.0000');

    await expect(purchaseReceiptService.postReceipt(orgAId, receiptId, userAId)).rejects.toThrow(
      OverReceivingError,
    );
  });

  it('DOUBLE-POST: rejects posting a receipt that is already posted', async () => {
    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockReceipt,
      status: 'posted',
    });

    await expect(purchaseReceiptService.postReceipt(orgAId, receiptId, userAId)).rejects.toThrow(
      PurchaseReceiptAlreadyPostedError,
    );
  });
});
