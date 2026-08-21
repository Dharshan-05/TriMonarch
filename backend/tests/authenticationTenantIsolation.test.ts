import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';

describe('Authentication Tenant Isolation Tests (Phase 041)', () => {
  const userAId = '33333333-3333-3333-3333-333333333333';
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const tokenA = signAccessToken(userAId, orgAId).accessToken;

  it('should reject request when authenticated Tenant A attempts to access Tenant B via header override', async () => {
    const res = await request(app)
      .get('/api/v1/audits')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgBId);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Cross-organization access denied');
  });

  it('should reject request when authenticated Tenant A attempts to override organizationId in query parameter', async () => {
    const res = await request(app)
      .get(`/api/v1/audits?organizationId=${orgBId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Cross-organization access denied');
  });
});
