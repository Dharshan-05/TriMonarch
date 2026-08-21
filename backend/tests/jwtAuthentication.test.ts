import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  AuthenticationError,
} from '../src/utils/jwt';
import { userRepository } from '../src/repositories/user.repository';
import { tokenRevocationService } from '../src/services/tokenRevocation.service';
import { hashPassword } from '../src/utils/password';

describe('Phase 043 — JWT Authentication Architecture & Token Service', () => {
  const userAId = '33333333-3333-3333-3333-333333333333';
  const orgAId = '11111111-1111-1111-1111-111111111111';

  it('should sign access token with required minimal claims (sub, organizationId, jti, type=access, iss, aud)', async () => {
    const { accessToken, jti, expiresIn } = signAccessToken(userAId, orgAId);
    expect(accessToken).toBeDefined();
    expect(jti).toBeDefined();
    expect(expiresIn).toBeGreaterThan(0);

    const decoded = await verifyAccessToken(accessToken);
    expect(decoded.sub).toBe(userAId);
    expect(decoded.organizationId).toBe(orgAId);
    expect(decoded.jti).toBe(jti);
    expect(decoded.type).toBe('access');
    expect(decoded.iss).toBe('trimonarch-erp');
    expect(decoded.aud).toBe('trimonarch-api');
  });

  it('should sign refresh token with type=refresh claim', async () => {
    const { refreshToken, jti, expiresIn } = signRefreshToken(userAId, orgAId);
    expect(refreshToken).toBeDefined();
    expect(jti).toBeDefined();
    expect(expiresIn).toBeGreaterThan(0);

    const decoded = await verifyRefreshToken(refreshToken);
    expect(decoded.sub).toBe(userAId);
    expect(decoded.organizationId).toBe(orgAId);
    expect(decoded.jti).toBe(jti);
    expect(decoded.type).toBe('refresh');
  });

  it('should reject refresh token when passed to verifyAccessToken', async () => {
    const { refreshToken } = signRefreshToken(userAId, orgAId);
    await expect(verifyAccessToken(refreshToken)).rejects.toThrow(AuthenticationError);
  });

  it('should reject access token when passed to verifyRefreshToken', async () => {
    const { accessToken } = signAccessToken(userAId, orgAId);
    await expect(verifyRefreshToken(accessToken)).rejects.toThrow(AuthenticationError);
  });

  it('POST /api/v1/auth/login should return both accessToken and refreshToken', async () => {
    const plainPassword = 'Password123!';
    const hashedPassword = await hashPassword(plainPassword);

    const mockUserWithAuth = {
      id: userAId,
      organization_id: orgAId,
      name: 'Test User',
      email: 'user@acme.com',
      phone: null,
      status: 'active' as const,
      created_at: new Date(),
      updated_at: new Date(),
      password_hash: hashedPassword,
      password_changed_at: null,
      last_login_at: null,
    };

    vi.spyOn(userRepository, 'findByEmailForAuthentication').mockResolvedValueOnce(mockUserWithAuth);
    vi.spyOn(userRepository, 'updateLastLogin').mockResolvedValueOnce();

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@acme.com', password: plainPassword });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
    expect(response.body.data.tokenType).toBe('Bearer');
  });

  it('POST /api/v1/auth/refresh should verify refresh token, rotate refresh token, and issue new tokens', async () => {
    const { refreshToken: oldRefreshToken, jti: oldJti } = signRefreshToken(userAId, orgAId);

    const mockUser = {
      id: userAId,
      organization_id: orgAId,
      name: 'Test User',
      email: 'user@acme.com',
      phone: null,
      status: 'active' as const,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(tokenRevocationService, 'isTokenRevoked').mockResolvedValueOnce(false);
    vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(mockUser);
    vi.spyOn(tokenRevocationService, 'revokeToken').mockResolvedValueOnce();

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
    expect(response.body.data.refreshToken).not.toBe(oldRefreshToken);
    expect(tokenRevocationService.revokeToken).toHaveBeenCalledWith(oldJti, userAId, expect.any(Date));
  });

  it('POST /api/v1/auth/refresh should reject revoked refresh token', async () => {
    const { refreshToken } = signRefreshToken(userAId, orgAId);

    vi.spyOn(tokenRevocationService, 'isTokenRevoked').mockResolvedValueOnce(true);

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('TOKEN_REVOKED');
  });
});
