import { describe, it, expect } from 'vitest';
import { policyEngine } from '../../../src/services/policyEngine.service';
import { authzOrgA } from './authzFixtures';

describe('Phase 069 — State Transition Authorization Audit', () => {
  it('prevents low-privileged user from triggering sensitive state transitions', () => {
    const ctx = { userId: 'u-1', organizationId: authzOrgA.id, roles: ['EMPLOYEE'] };
    const salesOrder = { id: 'so-1', organization_id: authzOrgA.id, status: 'draft' };

    const allowed = policyEngine.can(ctx, 'APPROVE' as never, 'sales_order', salesOrder);
    expect(allowed).toBe(false);
  });
});
