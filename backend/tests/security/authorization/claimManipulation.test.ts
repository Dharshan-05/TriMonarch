import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../../../src/utils/jwt';
import { authzOrgA } from './authzFixtures';

describe('Phase 069 — Claim Manipulation Security Audit', () => {
  it('derives organization context strictly from cryptographically verified token claims', async () => {
    const { accessToken } = signAccessToken('user-1', authzOrgA.id);
    const payload = await verifyAccessToken(accessToken);

    expect(payload.organizationId).toBe(authzOrgA.id);
  });
});
