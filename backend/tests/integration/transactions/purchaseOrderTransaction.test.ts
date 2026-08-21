import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderService } from '../../../src/services/purchaseOrder.service';
import { purchaseOrderRepository } from '../../../src/repositories/purchaseOrder.repository';
import * as txModule from '../../../src/db/transaction';
import { orgAId } from './transactionFixtures';

describe('Phase 064 — Purchase Order Transaction Rollback Tests', () => {
  it('purchase order item failure rolls back purchase order creation', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementationOnce(async (cb) => cb({} as never));
    vi.spyOn(purchaseOrderRepository, 'createItem').mockRejectedValueOnce(new Error('PO_ITEM_FAILURE'));

    await expect(
      purchaseOrderService.createPurchaseOrder({
        organization_id: orgAId,
        supplier_id: 'supp-001',
        order_number: 'PO-TX-001',
        items: [
          { product_id: 'prod-001', quantity: '5', unit_cost: '20.00' },
        ],
      }),
    ).rejects.toThrow();
  });
});
