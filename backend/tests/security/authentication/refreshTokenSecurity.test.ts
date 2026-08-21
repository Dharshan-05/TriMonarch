import { describe, it, expect } from 'vitest';
import { signRefreshToken, verifyRefreshToken } from '../../../src/utils/jwt';

describe('Phase 068 — Refresh Token Security Audit', () => {
  it('signs and verifies valid refresh tokens', async () => {
    const { refreshToken } = signRefreshToken('u-1', '11111111-1111-1111-1111-111111111111');
    const payload = await verifyRefreshToken(refreshToken);

    expect(payload.sub).toBe('u-1');
    expect(payload.organizationId).toBe('11111111-1111-1111-1111-111111111111');
    expect(payload.type).toBe('refresh');
  });
});
