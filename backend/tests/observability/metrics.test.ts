import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 075 — Prometheus Metrics Endpoint Audit', () => {
  it('GET /metrics returns Prometheus formatted plain text metrics', async () => {
    const res = await request(app).get('/metrics');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('trimonarch_http_requests_total');
    expect(res.text).toContain('trimonarch_process_uptime_seconds');
  });
});
