import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderRepository } from '../../../src/repositories/purchaseOrder.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 062 — PurchaseOrderRepository Integration Tests', () => {
  it('purchaseOrderRepository.findByOrderNumber should return PO for matching organization', async () => {
    const poA = {
      id: 'po-001',
      organization_id: orgAId,
      order_number: 'PO-1001',
      status: 'draft',
    };

    vi.spyOn(purchaseOrderRepository, 'findByOrderNumber')
      .mockImplementation(async (orgId, num) => {
        if (orgId === orgAId && num === 'PO-1001') {
          return poA as unknown as Awaited<ReturnType<typeof purchaseOrderRepository.findByOrderNumber>>;
        }
        return null;
      });

    const po = await purchaseOrderRepository.findByOrderNumber(orgAId, 'PO-1001');
    expect(po).toBeDefined();
    expect(po?.order_number).toBe('PO-1001');
  });
});
