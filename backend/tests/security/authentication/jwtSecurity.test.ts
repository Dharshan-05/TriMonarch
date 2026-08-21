import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, InvalidTokenError } from '../../../src/utils/jwt';
import { MALFORMED_JWT_PAYLOADS } from './authSecurityPayloads';

describe('Phase 068 — JWT Security Audit', () => {
  it('signs and verifies valid JWT access tokens', async () => {
    const { accessToken } = signAccessToken('u-1', '11111111-1111-1111-1111-111111111111');
    const payload = await verifyAccessToken(accessToken);

    expect(payload.sub).toBe('u-1');
    expect(payload.organizationId).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('rejects malformed or tampered JWT access tokens', async () => {
    for (const token of MALFORMED_JWT_PAYLOADS) {
      await expect(verifyAccessToken(token)).rejects.toThrow(InvalidTokenError);
    }
  });
});
