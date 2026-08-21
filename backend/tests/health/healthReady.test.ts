import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import * as dbHealth from '../../src/health/databaseHealth';

describe('Phase 075 — Readiness Health Check Audit', () => {
  it('GET /health/ready returns 200 OK when database is healthy', async () => {
    vi.spyOn(dbHealth, 'checkDatabaseHealth').mockResolvedValue({ healthy: true, latencyMs: 2 });

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.checks.database).toBe('ok');
  });

  it('GET /health/ready returns 503 Service Unavailable when database is unhealthy', async () => {
    vi.spyOn(dbHealth, 'checkDatabaseHealth').mockResolvedValue({ healthy: false, error: 'Database connection unavailable' });

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not_ready');
    expect(res.body.checks.database).toBe('unavailable');
  });
});
