import { describe, it, expect } from 'vitest';
import { policyEngine } from '../../../src/services/policyEngine.service';
import { authzOrgA, authzOrgB } from './authzFixtures';

describe('Phase 069 — IDOR / BOLA Security Audit', () => {
  it('denies cross-tenant resource access when requesting resource owned by Org B with Org A context', () => {
    const ctx = { userId: 'u-1', organizationId: authzOrgA.id, roles: ['EMPLOYEE'] };
    const resourceFromOrgB = { id: 'res-b-100', organization_id: authzOrgB.id };

    const allowed = policyEngine.can(ctx, 'READ', 'product', resourceFromOrgB);
    expect(allowed).toBe(false);
  });
});
