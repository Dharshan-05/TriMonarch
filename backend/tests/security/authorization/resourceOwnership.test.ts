import { describe, it, expect } from 'vitest';
import { policyEngine } from '../../../src/services/policyEngine.service';
import { authzOrgA, authzOrgB } from './authzFixtures';

describe('Phase 069 — Resource Ownership Security Audit', () => {
  it('prevents user from accessing resource belonging to a different tenant regardless of resource ID knowledge', () => {
    const ctx = { userId: 'u-1', organizationId: authzOrgA.id, roles: ['EMPLOYEE'] };
    const foreignResource = { id: 'secret-res-123', organization_id: authzOrgB.id };

    const allowed = policyEngine.can(ctx, 'READ', 'product', foreignResource);
    expect(allowed).toBe(false);
  });
});
