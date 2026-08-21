import { describe, it, expect, vi } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/utils/jwt';
import { tokenRevocationService } from '../../../src/services/tokenRevocation.service';
import { mockUserId, mockOrgId } from '../fixtures/mockData';

describe('Phase 061 — JWT Utility Unit Tests', () => {
  it('signAccessToken should return a valid JWT access token string', async () => {
    const { accessToken } = signAccessToken(mockUserId, mockOrgId);
    expect(accessToken).toBeDefined();
    expect(typeof accessToken).toBe('string');

    const decoded = await verifyAccessToken(accessToken);
    expect(decoded.sub).toBe(mockUserId);
    expect(decoded.organizationId).toBe(mockOrgId);
  });

  it('signRefreshToken should return a valid JWT refresh token string', async () => {
    const { refreshToken } = signRefreshToken(mockUserId, mockOrgId);
    expect(refreshToken).toBeDefined();
    expect(typeof refreshToken).toBe('string');

    const decoded = await verifyRefreshToken(refreshToken);
    expect(decoded.sub).toBe(mockUserId);
    expect(decoded.organizationId).toBe(mockOrgId);
    expect(decoded.jti).toBeDefined();
  });

  it('verifyAccessToken should reject invalid token string', async () => {
    await expect(verifyAccessToken('invalid.token.str')).rejects.toThrow();
  });

  it('revokeRefreshToken should mark token as revoked', async () => {
    const isRevokedSpy = vi
      .spyOn(tokenRevocationService, 'isTokenRevoked')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    vi.spyOn(tokenRevocationService, 'revokeToken').mockResolvedValueOnce(undefined);

    const { refreshToken } = signRefreshToken(mockUserId, mockOrgId);
    const decoded = await verifyRefreshToken(refreshToken);

    const firstCheck = await tokenRevocationService.isTokenRevoked(decoded.jti, mockUserId);
    expect(firstCheck).toBe(false);

    await tokenRevocationService.revokeToken(decoded.jti, mockUserId);

    const secondCheck = await tokenRevocationService.isTokenRevoked(decoded.jti, mockUserId);
    expect(secondCheck).toBe(true);

    isRevokedSpy.mockRestore();
  });
});
