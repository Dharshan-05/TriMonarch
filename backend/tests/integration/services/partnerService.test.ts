import { describe, it, expect, vi } from 'vitest';
import { partnerService } from '../../../src/services/partner.service';
import { customerRepository } from '../../../src/repositories/customer.repository';
import { orgAId, orgBId } from '../fixtures/database';

describe('Phase 063 — PartnerService Integration Tests', () => {
  it('partnerService.getCustomerById should return customer for matching organization', async () => {
    const customerA = {
      id: 'c-001',
      organization_id: orgAId,
      type: 'customer',
      name: 'Acme Customer',
      status: 'active',
    };

    vi.spyOn(customerRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === 'c-001') return customerA as unknown as Awaited<ReturnType<typeof customerRepository.findById>>;
      return null;
    });

    const customer = await partnerService.getCustomerById(orgAId, 'c-001');
    expect(customer).toBeDefined();
    expect(customer?.organization_id).toBe(orgAId);

    await expect(partnerService.getCustomerById(orgBId, 'c-001')).rejects.toThrow();
  });
});
