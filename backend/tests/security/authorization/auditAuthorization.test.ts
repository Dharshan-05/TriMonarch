import { describe, it, expect } from 'vitest';
import { policyEngine } from '../../../src/services/policyEngine.service';
import { authzOrgA } from './authzFixtures';

describe('Phase 069 — Audit Authorization Security Audit', () => {
  it('prevents non-admin user from managing or exporting audit records', () => {
    const ctx = { userId: 'u-1', organizationId: authzOrgA.id, roles: ['EMPLOYEE'] };
    const auditRecord = { id: 'audit-1', organization_id: authzOrgA.id };

    const allowed = policyEngine.can(ctx, 'DELETE', 'audit', auditRecord);
    expect(allowed).toBe(false);
  });
});
