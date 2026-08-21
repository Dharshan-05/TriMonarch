import { describe, it, expect } from 'vitest';
import { authorizationService } from '../src/services/authorization.service';

describe('Authorization Service Unit Tests (Phase 044)', () => {
  it('hasRole should match exact roles and grant access to SUPER_ADMIN', () => {
    expect(authorizationService.hasRole(['EMPLOYEE'], 'EMPLOYEE')).toBe(true);
    expect(authorizationService.hasRole(['EMPLOYEE'], 'ADMIN')).toBe(false);
    expect(authorizationService.hasRole(['SUPER_ADMIN'], 'ADMIN')).toBe(true);
  });

  it('hasAnyRole should match if user has any of the specified roles', () => {
    expect(authorizationService.hasAnyRole(['EMPLOYEE'], ['MANAGER', 'EMPLOYEE'])).toBe(true);
    expect(authorizationService.hasAnyRole(['EMPLOYEE'], ['ADMIN', 'MANAGER'])).toBe(false);
    expect(authorizationService.hasAnyRole(['ADMIN'], ['MANAGER', 'EMPLOYEE'])).toBe(false);
  });

  it('hasPermission should evaluate granular permissions correctly per role', () => {
    expect(authorizationService.hasPermission(['ADMIN'], 'user:create')).toBe(true);
    expect(authorizationService.hasPermission(['EMPLOYEE'], 'user:create')).toBe(false);
    expect(authorizationService.hasPermission(['EMPLOYEE'], 'product:read')).toBe(true);
    expect(authorizationService.hasPermission(['AUDITOR'], 'audit:read')).toBe(true);
    expect(authorizationService.hasPermission(['AUDITOR'], 'user:delete')).toBe(false);
  });

  it('canAccessOrganization should enforce tenant isolation', () => {
    const orgA = '11111111-1111-1111-1111-111111111111';
    const orgB = '22222222-2222-2222-2222-222222222222';

    expect(authorizationService.canAccessOrganization(orgA, orgA)).toBe(true);
    expect(authorizationService.canAccessOrganization(orgA, orgB)).toBe(false);
  });

  it('canAccessResource should permit owner or privileged roles', () => {
    const userA = 'user-a';
    const userB = 'user-b';

    expect(authorizationService.canAccessResource(userA, userA, ['EMPLOYEE'], 'employee:read')).toBe(true);
    expect(authorizationService.canAccessResource(userA, userB, ['EMPLOYEE'], 'employee:read')).toBe(false);
    expect(authorizationService.canAccessResource(userA, userB, ['ADMIN'], 'employee:read')).toBe(true);
  });
});
