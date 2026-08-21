import { describe, it, expect } from 'vitest';
import { policyEngine } from '../../../src/services/policyEngine.service';
import { authzOrgA } from './authzFixtures';

describe('Phase 069 — Destructive Operations Authorization Audit', () => {
  it('requires explicit DELETE permission for destructive deletion operations', () => {
    const ctx = { userId: 'u-1', organizationId: authzOrgA.id, roles: ['EMPLOYEE'] };
    const product = { id: 'p-1', organization_id: authzOrgA.id };

    const allowed = policyEngine.can(ctx, 'DELETE', 'product', product);
    expect(allowed).toBe(false);
  });
});
