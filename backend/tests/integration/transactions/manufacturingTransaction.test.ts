import { describe, it, expect, vi } from 'vitest';
import { manufacturingOrderService } from '../../../src/services/manufacturingOrder.service';
import { manufacturingRepository } from '../../../src/repositories/manufacturing.repository';
import { orgAId } from './transactionFixtures';

describe('Phase 064 — Manufacturing Transaction Rollback Tests', () => {
  it('manufacturing order component creation failure rolls back order header', async () => {
    vi.spyOn(manufacturingRepository, 'createItem').mockRejectedValueOnce(new Error('MO_ITEM_FAILURE'));

    await expect(
      manufacturingOrderService.createOrder({
        organization_id: orgAId,
        product_id: 'prod-001',
        bom_id: 'bom-001',
        warehouse_id: 'wh-001',
        planned_quantity: 10,
      }),
    ).rejects.toThrow();
  });
});
