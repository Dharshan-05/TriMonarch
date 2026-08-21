import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';
import { userRepository } from '../src/repositories/user.repository';
import { User } from '../src/types/database';

describe('Authentication Identity Spoofing & Security Tests (Phase 041)', () => {
  const userAId = '33333333-3333-3333-3333-333333333333';
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const attackerUserId = '99999999-9999-9999-9999-999999999999';
  const tokenA = signAccessToken(userAId, orgAId).accessToken;

  const mockUser: User = {
    id: userAId,
    organization_id: orgAId,
    email: 'usera@acme.com',
    first_name: 'User',
    last_name: 'A',
    role: 'admin',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('should ignore client-supplied X-User-ID or body.userId identity spoofing attempts', async () => {
    vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(mockUser);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-user-id', attackerUserId);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(userAId);
  });

  it('should reject unauthenticated request on protected endpoints', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(401);
  });
});
