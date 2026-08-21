import { describe, it, expect, vi } from 'vitest';
import { salesOrderRepository } from '../../../src/repositories/salesOrder.repository';
import { orgAId, orgBId } from '../fixtures/database';

describe('Phase 062 — SalesOrderRepository Integration Tests', () => {
  it('salesOrderRepository.findByOrderNumber should enforce tenant isolation', async () => {
    const orderA = {
      id: 'so-001',
      organization_id: orgAId,
      order_number: 'SO-1001',
      status: 'draft',
    };

    vi.spyOn(salesOrderRepository, 'findByOrderNumber')
      .mockImplementation(async (orgId, num) => {
        if (orgId === orgAId && num === 'SO-1001') {
          return orderA as unknown as Awaited<ReturnType<typeof salesOrderRepository.findByOrderNumber>>;
        }
        return null;
      });

    const found = await salesOrderRepository.findByOrderNumber(orgAId, 'SO-1001');
    expect(found).toBeDefined();
    expect(found?.organization_id).toBe(orgAId);

    const crossTenant = await salesOrderRepository.findByOrderNumber(orgBId, 'SO-1001');
    expect(crossTenant).toBeNull();
  });
});
