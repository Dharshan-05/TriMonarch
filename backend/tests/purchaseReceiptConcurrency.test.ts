import { describe, it, expect, vi } from 'vitest';
import { purchaseReceiptService } from '../src/services/purchaseReceipt.service';
import { purchaseReceiptRepository } from '../src/repositories/purchaseReceipt.repository';
import { purchaseOrderRepository } from '../src/repositories/purchaseOrder.repository';
import { inventoryService } from '../src/services/inventory.service';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { OverReceivingError } from '../src/types';
import { PoolClient } from 'pg';
import { PurchaseReceipt, PurchaseReceiptItem, AuditLog, Inventory } from '../src/types/database';

describe('Purchase Receipt Concurrency Control (Phase 029)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const whId = '55555555-5555-5555-5555-555555555555';
  const prodId = '66666666-6666-6666-6666-666666666666';
  const poId = '77777777-7777-7777-7777-777777777777';
  const poItemId = '88888888-8888-8888-8888-888888888888';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockPO = {
    id: poId,
    organization_id: orgAId,
    supplier_id: 'supp-1',
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

  const mockReceipt1: PurchaseReceipt = {
    id: 'rec-1',
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

  const mockReceipt2: PurchaseReceipt = {
    id: 'rec-2',
    organization_id: orgAId,
    purchase_order_id: poId,
    receipt_number: 'REC-100002',
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

  const item1: PurchaseReceiptItem = {
    id: 'item-1',
    organization_id: orgAId,
    receipt_id: 'rec-1',
    purchase_order_item_id: poItemId,
    product_id: prodId,
    quantity: '7.0000',
    unit_cost: '50.0000',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const item2: PurchaseReceiptItem = {
    id: 'item-2',
    organization_id: orgAId,
    receipt_id: 'rec-2',
    purchase_order_item_id: poItemId,
    product_id: prodId,
    quantity: '5.0000',
    unit_cost: '50.0000',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('should prevent over-receiving when concurrent receipts attempt to receive more than remaining stock', async () => {
    vi.spyOn(inventoryService, 'increaseStock').mockResolvedValue({ id: 'inv-1' } as Inventory);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    // Request 1: receives 7
    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockReceipt1);
    vi.spyOn(purchaseReceiptRepository, 'listItems').mockResolvedValueOnce([item1]);
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValue(mockPO);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValue([mockPOItem]);
    vi.spyOn(purchaseReceiptRepository, 'getReceivedQuantityForPurchaseOrderItem')
      .mockResolvedValueOnce('0.0000') // remaining = 10 - 0 = 10 -> 7 fits
      .mockResolvedValueOnce('7.0000'); // for PO status check
    vi.spyOn(purchaseReceiptRepository, 'update').mockResolvedValueOnce({
      ...mockReceipt1,
      status: 'posted',
    });

    const res1 = await purchaseReceiptService.postReceipt(orgAId, 'rec-1', userAId);
    expect(res1.status).toBe('posted');

    // Request 2: attempts to receive 5 (remaining is 10 - 7 = 3) -> should throw OverReceivingError
    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockReceipt2);
    vi.spyOn(purchaseReceiptRepository, 'listItems').mockResolvedValueOnce([item2]);
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockPO);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValueOnce([mockPOItem]);
    vi.spyOn(purchaseReceiptRepository, 'getReceivedQuantityForPurchaseOrderItem').mockResolvedValueOnce(
      '7.0000',
    ); // remaining = 3 -> 5 fails!

    await expect(purchaseReceiptService.postReceipt(orgAId, 'rec-2', userAId)).rejects.toThrow(
      OverReceivingError,
    );
  });
});
