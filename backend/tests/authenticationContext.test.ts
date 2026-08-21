import { describe, it, expect } from 'vitest';
import { authService } from '../src/services/auth.service';
import { User } from '../src/types/database';
import { UserAuthenticationDisabledError } from '../src/errors/authentication.errors';

describe('Authentication Context Foundation Tests (Phase 041)', () => {
  const mockUser: User = {
    id: '33333333-3333-3333-3333-333333333333',
    organization_id: '11111111-1111-1111-1111-111111111111',
    email: 'test@acme.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'admin',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('should derive immutable server-side AuthContext from user record', () => {
    const ctx = authService.getAuthenticationContext(mockUser, 'jti-123');
    expect(ctx.userId).toBe('33333333-3333-3333-3333-333333333333');
    expect(ctx.organizationId).toBe('11111111-1111-1111-1111-111111111111');
    expect(ctx.jti).toBe('jti-123');
  });

  it('should validate user status and throw UserAuthenticationDisabledError if inactive', () => {
    const inactiveUser: User = { ...mockUser, status: 'inactive' };
    expect(() => authService.validateUserStatus(inactiveUser)).toThrow(UserAuthenticationDisabledError);
  });

  it('should pass validation for active user status', () => {
    expect(() => authService.validateUserStatus(mockUser)).not.toThrow();
  });
});
