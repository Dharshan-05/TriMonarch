import { describe, it, expect } from 'vitest';
import { auditPolicy } from '../src/policies/audit.policy';
import { PolicyContext } from '../src/types/policy';

describe('Audit Policy Immutability Tests (Phase 045)', () => {
  const orgA = '11111111-1111-1111-1111-111111111111';

  it('should allow read access to audit logs within same organization', () => {
    const context: PolicyContext = { userId: 'aud-1', organizationId: orgA, roles: ['AUDITOR'] };
    const resource = { id: 'audit-1', organization_id: orgA };

    const decision = auditPolicy.evaluate(context, 'READ', resource);
    expect(decision.allowed).toBe(true);
  });

  it('should deny UPDATE and DELETE operations on audit logs even for SUPER_ADMIN', () => {
    const context: PolicyContext = { userId: 'admin-1', organizationId: orgA, roles: ['SUPER_ADMIN'] };
    const resource = { id: 'audit-1', organization_id: orgA };

    const updateDecision = auditPolicy.evaluate(context, 'UPDATE', resource);
    expect(updateDecision.allowed).toBe(false);
    expect(updateDecision.reason).toContain('strictly immutable');

    const deleteDecision = auditPolicy.evaluate(context, 'DELETE', resource);
    expect(deleteDecision.allowed).toBe(false);
    expect(deleteDecision.reason).toContain('strictly immutable');
  });
});
