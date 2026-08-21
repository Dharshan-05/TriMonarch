import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../../../src/utils/jwt';
import { authOrgA, authOrgB } from './authFixtures';

describe('Phase 068 — Authentication Tenant Isolation Audit', () => {
  it('enforces trusted organization claim in verified token', async () => {
    const { accessToken } = signAccessToken('user-1', authOrgA.id);
    const payload = await verifyAccessToken(accessToken);

    expect(payload.organizationId).toBe(authOrgA.id);
    expect(payload.organizationId).not.toBe(authOrgB.id);
  });
});
