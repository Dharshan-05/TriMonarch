import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from '../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';
import { signAccessToken } from '../src/utils/jwt';

describe('Authentication Middleware Foundation Tests (Phase 041)', () => {
  const userId = '33333333-3333-3333-3333-333333333333';
  const orgId = '11111111-1111-1111-1111-111111111111';

  it('should reject unauthenticated request without Authorization header', async () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should reject malformed Authorization header format', async () => {
    const req = { headers: { authorization: 'Basic token123' } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should populate req.auth with server-derived userId and organizationId on valid token', async () => {
    const token = signAccessToken(userId, orgId).accessToken;
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.auth?.userId).toBe(userId);
    expect(req.auth?.organizationId).toBe(orgId);
  });
});
