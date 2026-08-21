import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 075 — Request Correlation Logging Audit', () => {
  it('propagates custom X-Request-ID header in response', async () => {
    const customId = 'req-corr-12345';
    const res = await request(app).get('/health/live').set('X-Request-ID', customId);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(customId);
  });
});
