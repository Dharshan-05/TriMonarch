import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { authService } from '../src/services/auth.service';
import { AuthenticationError } from '../src/utils/jwt';
import { UserAuthenticationDisabledError } from '../src/errors/authentication.errors';

describe('Phase 047 — Authentication API Endpoints (/api/v1/auth)', () => {
  it('POST /api/v1/auth/login should return tokens on valid credentials', async () => {
    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      accessToken: 'valid-access-token',
      refreshToken: 'valid-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        organization_id: '22222222-2222-2222-2222-222222222222',
        email: 'user@acme.com',
        name: 'Jane Doe',
        phone: null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@acme.com', password: 'ValidPassword123!' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe('valid-access-token');
    expect(response.body.data.refreshToken).toBe('valid-refresh-token');
    expect(response.body.meta.requestId).toBeDefined();
  });

  it('POST /api/v1/auth/login should return generic 401 on invalid credentials', async () => {
    vi.spyOn(authService, 'login').mockRejectedValueOnce(
      new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS'),
    );

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@acme.com', password: 'ValidPassword123!' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/v1/auth/login should return 401 when account is disabled', async () => {
    vi.spyOn(authService, 'login').mockRejectedValueOnce(
      new UserAuthenticationDisabledError('User account is disabled or suspended'),
    );

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'disabled@acme.com', password: 'ValidPassword123!' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('ACCOUNT_DISABLED');
  });

  it('POST /api/v1/auth/refresh should rotate and return new token pair', async () => {
    vi.spyOn(authService, 'refreshToken').mockResolvedValueOnce({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        organization_id: '22222222-2222-2222-2222-222222222222',
        email: 'user@acme.com',
        name: 'Jane Doe',
        phone: null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'valid-refresh-token' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe('new-access-token');
    expect(response.body.data.refreshToken).toBe('new-refresh-token');
  });

  it('GET /api/v1/auth/status should return unauthenticated status when no token provided', async () => {
    const response = await request(app).get('/api/v1/auth/status');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.authenticated).toBe(false);
  });
});
