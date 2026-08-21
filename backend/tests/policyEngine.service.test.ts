import { describe, it, expect } from 'vitest';
import { policyEngine } from '../src/services/policyEngine.service';
import { PolicyContext } from '../src/types/policy';
import { InsufficientPermissionsError } from '../src/errors/authentication.errors';

describe('Policy Engine Service Tests (Phase 045)', () => {
  const context: PolicyContext = {
    userId: 'user-1',
    organizationId: '11111111-1111-1111-1111-111111111111',
    roles: ['EMPLOYEE'],
  };

  it('can() should return false and deny access by default for unregistered resource types', () => {
    const allowed = policyEngine.can(context, 'READ', 'UNKNOWN_RESOURCE');
    expect(allowed).toBe(false);
  });

  it('assertCan() should throw InsufficientPermissionsError (403) when denied', () => {
    expect(() =>
      policyEngine.assertCan(context, 'DELETE', 'USER', {
        id: 'user-2',
        organization_id: context.organizationId,
      }),
    ).toThrow(InsufficientPermissionsError);
  });

  it('assertCan() should succeed when allowed', () => {
    const adminContext: PolicyContext = {
      userId: 'admin-1',
      organizationId: '11111111-1111-1111-1111-111111111111',
      roles: ['ADMIN'],
    };

    expect(() =>
      policyEngine.assertCan(adminContext, 'CREATE', 'USER', {
        organization_id: adminContext.organizationId,
      }),
    ).not.toThrow();
  });
});
