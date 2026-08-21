import { describe, it, expect, vi } from 'vitest';
import { customerRepository } from '../../../src/repositories/customer.repository';
import { supplierRepository } from '../../../src/repositories/supplier.repository';
import { orgAId, orgBId } from '../fixtures/database';
import { createTestPartnerOrgAData, createTestPartnerOrgBData } from '../fixtures/partners';

describe('Phase 062 — Customer & Supplier Repository Integration Tests', () => {
  it('customerRepository.findById and supplierRepository.findById should enforce tenant isolation', async () => {
    const partnerA = createTestPartnerOrgAData();
    const partnerB = createTestPartnerOrgBData();

    vi.spyOn(customerRepository, 'findById')
      .mockImplementation(async (orgId, id) => {
        if (orgId === orgAId && id === partnerA.id) return partnerA as unknown as Awaited<ReturnType<typeof customerRepository.findById>>;
        return null;
      });

    vi.spyOn(supplierRepository, 'findById')
      .mockImplementation(async (orgId, id) => {
        if (orgId === orgBId && id === partnerB.id) return partnerB as unknown as Awaited<ReturnType<typeof supplierRepository.findById>>;
        return null;
      });

    const customer = await customerRepository.findById(orgAId, partnerA.id);
    expect(customer).toBeDefined();
    expect(customer?.type).toBe('customer');

    const supplier = await supplierRepository.findById(orgBId, partnerB.id);
    expect(supplier).toBeDefined();
    expect(supplier?.type).toBe('supplier');

    const crossCustomer = await customerRepository.findById(orgBId, partnerA.id);
    expect(crossCustomer).toBeNull();
  });
});
