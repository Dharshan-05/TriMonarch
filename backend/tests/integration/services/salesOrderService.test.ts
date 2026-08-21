import { describe, it, expect, vi } from 'vitest';
import { salesOrderService } from '../../../src/services/salesOrder.service';
import { salesOrderRepository } from '../../../src/repositories/salesOrder.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 063 — SalesOrderService Integration Tests', () => {
  it('getSalesOrderById should return sales order header for organization', async () => {
    const mockOrder = {
      id: 'so-100',
      organization_id: orgAId,
      order_number: 'SO-100',
      status: 'draft',
    };

    vi.spyOn(salesOrderRepository, 'findById').mockResolvedValueOnce(mockOrder as unknown as Awaited<ReturnType<typeof salesOrderRepository.findById>>);

    const order = await salesOrderService.getSalesOrderById(orgAId, 'so-100');
    expect(order).toBeDefined();
    expect(order.order_number).toBe('SO-100');
  });
});
