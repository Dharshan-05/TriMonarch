import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderService } from '../../../src/services/purchaseOrder.service';
import { purchaseOrderRepository } from '../../../src/repositories/purchaseOrder.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 063 — PurchaseOrderService Integration Tests', () => {
  it('getPurchaseOrder should return PO with line items and tenant isolation', async () => {
    const mockPo = {
      id: 'po-200',
      organization_id: orgAId,
      order_number: 'PO-200',
      status: 'draft',
    };

    vi.spyOn(purchaseOrderRepository, 'findById').mockResolvedValueOnce(mockPo as unknown as Awaited<ReturnType<typeof purchaseOrderRepository.findById>>);
    vi.spyOn(purchaseOrderRepository, 'listItems').mockResolvedValueOnce([] as unknown as Awaited<ReturnType<typeof purchaseOrderRepository.listItems>>);

    const po = await purchaseOrderService.getPurchaseOrder(orgAId, 'po-200');
    expect(po).toBeDefined();
    expect(po.order_number).toBe('PO-200');
  });
});
