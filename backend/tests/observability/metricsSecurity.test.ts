import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 075 — Metrics Security & Bounded Cardinality Audit', () => {
  it('does not expose high-cardinality labels or secret credentials in /metrics', async () => {
    const res = await request(app).get('/metrics');

    expect(res.text).not.toContain('userId');
    expect(res.text).not.toContain('password');
    expect(res.text).not.toContain('token');
  });
});
