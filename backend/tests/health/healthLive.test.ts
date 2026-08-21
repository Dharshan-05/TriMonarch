import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 075 — Liveness Health Check Audit', () => {
  it('GET /health/live returns 200 OK without requiring database connectivity', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('trimonarch-erp-backend');
    expect(res.body.timestamp).toBeDefined();
  });
});
