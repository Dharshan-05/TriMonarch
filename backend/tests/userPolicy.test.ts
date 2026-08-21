import { describe, it, expect } from 'vitest';
import { userPolicy } from '../src/policies/user.policy';
import { PolicyContext } from '../src/types/policy';

describe('User Policy Unit Tests (Phase 045)', () => {
  const orgA = '11111111-1111-1111-1111-111111111111';
  const orgB = '22222222-2222-2222-2222-222222222222';

  it('should deny cross-tenant user access', () => {
    const context: PolicyContext = { userId: 'u-1', organizationId: orgA, roles: ['ADMIN'] };
    const resource = { id: 'u-2', organization_id: orgB };

    const decision = userPolicy.evaluate(context, 'READ', resource);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('Cross-tenant user access denied');
  });

  it('should deny self-update of sensitive fields (role, status) by non-admin', () => {
    const context: PolicyContext = {
      userId: 'u-1',
      organizationId: orgA,
      roles: ['EMPLOYEE'],
      requestedFields: ['role', 'name'],
    };
    const resource = { id: 'u-1', organization_id: orgA };

    const decision = userPolicy.evaluate(context, 'UPDATE', resource);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('Users cannot update their own role');
  });

  it('should allow self-update of non-sensitive fields by employee', () => {
    const context: PolicyContext = {
      userId: 'u-1',
      organizationId: orgA,
      roles: ['EMPLOYEE'],
      requestedFields: ['name', 'phone'],
    };
    const resource = { id: 'u-1', organization_id: orgA };

    const decision = userPolicy.evaluate(context, 'UPDATE', resource);
    expect(decision.allowed).toBe(true);
  });
});
