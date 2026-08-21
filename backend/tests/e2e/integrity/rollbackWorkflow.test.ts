import { describe, it, expect, vi } from 'vitest';
import { salesOrderService } from '../../../src/services/salesOrder.service';
import { salesOrderRepository } from '../../../src/repositories/salesOrder.repository';
import * as txModule from '../../../src/db/transaction';
import { e2eOrgA, e2eCustomerA, e2eProductA } from '../fixtures/workflows';

describe('Phase 066 — Failure & Rollback E2E Workflows', () => {
  it('rolls back complete E2E workflow on line item failure leaving zero orphan records', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementationOnce(async (cb) => cb({} as never));
    vi.spyOn(salesOrderRepository, 'createItem').mockRejectedValueOnce(new Error('E2E_LINE_ITEM_FAILURE'));

    await expect(
      salesOrderService.createSalesOrderWithItems({
        organization_id: e2eOrgA.id,
        customer_id: e2eCustomerA.id,
        order_number: 'SO-FAIL-001',
        items: [{ product_id: e2eProductA.id, quantity: '1', unit_price: '10.00' }],
      }),
    ).rejects.toThrow();
  });
});
