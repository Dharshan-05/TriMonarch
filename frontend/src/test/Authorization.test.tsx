import { describe, it, expect } from 'vitest';
import {
  hasRole,
  hasAnyRole,
  hasPermission,
  hasAnyPermission,
  canAccess,
} from '@/features/authorization/authorization';

describe('Pure Authorization Logic', () => {
  it('evaluates hasRole correctly for ADMIN and SUPER_ADMIN', () => {
    expect(hasRole(['ADMIN'], 'ADMIN')).toBe(true);
    expect(hasRole(['SUPER_ADMIN'], 'MANAGER')).toBe(true); // SUPER_ADMIN bypass
    expect(hasRole(['EMPLOYEE'], 'ADMIN')).toBe(false);
  });

  it('evaluates hasAnyRole correctly', () => {
    expect(hasAnyRole(['EMPLOYEE'], ['MANAGER', 'EMPLOYEE'])).toBe(true);
    expect(hasAnyRole(['AUDITOR'], ['ADMIN', 'MANAGER'])).toBe(false);
  });

  it('evaluates hasPermission for role mappings', () => {
    // ADMIN has user:read, user:create, etc.
    expect(hasPermission(['ADMIN'], 'user:read')).toBe(true);
    expect(hasPermission(['ADMIN'], 'user:delete')).toBe(true);

    // EMPLOYEE has product:read, but not user:delete
    expect(hasPermission(['EMPLOYEE'], 'product:read')).toBe(true);
    expect(hasPermission(['EMPLOYEE'], 'user:delete')).toBe(false);

    // AUDITOR has audit:read and report:read
    expect(hasPermission(['AUDITOR'], 'audit:read')).toBe(true);
    expect(hasPermission(['AUDITOR'], 'user:create')).toBe(false);
  });

  it('evaluates hasAnyPermission correctly', () => {
    expect(hasAnyPermission(['EMPLOYEE'], ['user:delete', 'product:read'])).toBe(true);
    expect(hasAnyPermission(['EMPLOYEE'], ['user:delete', 'user:create'])).toBe(false);
  });

  it('evaluates canAccess with combined role and permission requirements', () => {
    expect(canAccess(['ADMIN'], { roles: ['ADMIN'], permissions: ['user:read'] })).toBe(true);
    expect(canAccess(['EMPLOYEE'], { roles: ['ADMIN'], permissions: ['product:read'] })).toBe(false);
  });
});
