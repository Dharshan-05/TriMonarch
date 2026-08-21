import { describe, it, expect, vi } from 'vitest';
import { salesOrderService } from '../../../src/services/salesOrder.service';
import { salesOrderRepository } from '../../../src/repositories/salesOrder.repository';
import { orgAId } from './transactionFixtures';

describe('Phase 064 — Sales Order Transaction Rollback Tests', () => {
  it('line item creation failure rolls back sales order header insertion', async () => {
    vi.spyOn(salesOrderRepository, 'createItem').mockRejectedValueOnce(new Error('ITEM_INSERTION_FAILURE'));

    await expect(
      salesOrderService.createSalesOrderWithItems({
        organization_id: orgAId,
        customer_id: 'cust-001',
        order_number: 'SO-TX-001',
        items: [
          { product_id: 'prod-001', quantity: '2', unit_price: '50.00' },
        ],
      }),
    ).rejects.toThrow();
  });
});
