import { describe, it, expect } from 'vitest';
import { policyEngine } from '../../../src/services/policyEngine.service';
import { authzOrgA, authzOrgB } from './authzFixtures';

describe('Phase 069 — Cross-Tenant Authorization Audit', () => {
  it('enforces tenant boundary strictly across organizations', () => {
    const ctxA = { userId: 'user-a', organizationId: authzOrgA.id, roles: ['ADMIN'] };
    const resA = { id: 'p-1', organization_id: authzOrgA.id };
    const resB = { id: 'p-2', organization_id: authzOrgB.id };

    expect(policyEngine.can(ctxA, 'READ', 'product', resA)).toBe(true);
    expect(policyEngine.can(ctxA, 'READ', 'product', resB)).toBe(false);
  });
});
