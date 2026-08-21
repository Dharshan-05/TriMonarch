import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';

describe('Phase 060 — Request Limit & Parameter Pollution Security', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgId = '22222222-2222-2222-2222-222222222222';
  const { accessToken } = signAccessToken(adminUserId, orgId);

  it('GET /api/v1/products with duplicate sensitive query parameters should return 400 HTTP_PARAMETER_POLLUTION', async () => {
    const response = await request(app)
      .get('/api/v1/products?page=1&page=9999')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('HTTP_PARAMETER_POLLUTION');
  });

  it('POST /api/v1/products with invalid Content-Type should return 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Content-Type', 'text/html')
      .send('<html><body>test</body></html>');

    expect(response.status).toBe(415);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });
});
