import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireRole, requirePermission } from '../src/middleware/rbac';
import { authorizationService } from '../src/services/authorization.service';
import { AuthenticationRequiredError, InsufficientPermissionsError } from '../src/errors/authentication.errors';

describe('RBAC Authorization Middleware Tests (Phase 044)', () => {
  const createMockReq = (auth?: { userId: string; organizationId: string; roles?: string[] }) => {
    return {
      auth,
    } as unknown as Request;
  };

  const mockRes = {} as Response;

  it('should throw AuthenticationRequiredError (401) if req.auth is missing', async () => {
    const middleware = requireRole('ADMIN');
    const req = createMockReq(undefined);
    const next = vi.fn() as NextFunction;

    await middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationRequiredError));
  });

  it('should call next() if user has the required role', async () => {
    vi.spyOn(authorizationService, 'getUserRoles').mockResolvedValueOnce(['ADMIN']);
    const middleware = requireRole('ADMIN');
    const req = createMockReq({ userId: 'u-1', organizationId: 'o-1' });
    const next = vi.fn() as NextFunction;

    await middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.auth?.roles).toEqual(['ADMIN']);
  });

  it('should throw InsufficientPermissionsError (403) if user lacks required role', async () => {
    vi.spyOn(authorizationService, 'getUserRoles').mockResolvedValueOnce(['EMPLOYEE']);
    const middleware = requireRole('ADMIN');
    const req = createMockReq({ userId: 'u-1', organizationId: 'o-1' });
    const next = vi.fn() as NextFunction;

    await middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(InsufficientPermissionsError));
  });

  it('requirePermission should call next() if user possesses permission', async () => {
    vi.spyOn(authorizationService, 'getUserRoles').mockResolvedValueOnce(['ADMIN']);
    const middleware = requirePermission('user:create');
    const req = createMockReq({ userId: 'u-1', organizationId: 'o-1' });
    const next = vi.fn() as NextFunction;

    await middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('requirePermission should throw InsufficientPermissionsError (403) if user lacks permission', async () => {
    vi.spyOn(authorizationService, 'getUserRoles').mockResolvedValueOnce(['EMPLOYEE']);
    const middleware = requirePermission('user:delete');
    const req = createMockReq({ userId: 'u-1', organizationId: 'o-1' });
    const next = vi.fn() as NextFunction;

    await middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(InsufficientPermissionsError));
  });
});
