import { describe, it, expect } from 'vitest';
import { authorizationService } from '../../../src/services/authorization.service';
import { StandardPermission } from '../../../src/types/rbac';

describe('Phase 061 — AuthorizationService Unit Tests', () => {
  it('hasRole should return true for exact role match or SUPER_ADMIN override', () => {
    expect(authorizationService.hasRole(['EMPLOYEE'], 'EMPLOYEE')).toBe(true);
    expect(authorizationService.hasRole(['SUPER_ADMIN'], 'MANAGER')).toBe(true);
    expect(authorizationService.hasRole(['EMPLOYEE'], 'MANAGER')).toBe(false);
  });

  it('hasAnyRole should return true if any role matches', () => {
    expect(authorizationService.hasAnyRole(['EMPLOYEE'], ['MANAGER', 'EMPLOYEE'])).toBe(true);
    expect(authorizationService.hasAnyRole(['EMPLOYEE'], ['ADMIN', 'MANAGER'])).toBe(false);
  });

  it('hasPermission should grant all permissions to SUPER_ADMIN and ADMIN', () => {
    expect(authorizationService.hasPermission(['SUPER_ADMIN'], 'user:write' as StandardPermission)).toBe(true);
    expect(authorizationService.hasPermission(['ADMIN'], 'product:write' as StandardPermission)).toBe(true);
  });

  it('hasPermission should check role permissions correctly for EMPLOYEE or MANAGER', () => {
    expect(authorizationService.hasPermission(['EMPLOYEE'], 'product:read' as StandardPermission)).toBe(true);
    expect(authorizationService.hasPermission(['EMPLOYEE'], 'user:delete' as StandardPermission)).toBe(false);
  });

  it('canAccessOrganization should enforce strict tenant isolation', () => {
    const orgA = '11111111-1111-1111-1111-111111111111';
    const orgB = '22222222-2222-2222-2222-222222222222';
    expect(authorizationService.canAccessOrganization(orgA, orgA)).toBe(true);
    expect(authorizationService.canAccessOrganization(orgA, orgB)).toBe(false);
  });

  it('canAccessResource should allow owner or privileged role with permission', () => {
    const userA = 'user-a';
    const userB = 'user-b';
    expect(authorizationService.canAccessResource(userA, userA, ['EMPLOYEE'], 'product:read' as StandardPermission)).toBe(true);
    expect(authorizationService.canAccessResource(userA, userB, ['EMPLOYEE'], 'product:read' as StandardPermission)).toBe(false);
    expect(authorizationService.canAccessResource(userA, userB, ['MANAGER'], 'product:read' as StandardPermission)).toBe(true);
  });
});
