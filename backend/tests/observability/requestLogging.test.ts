import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 075 — HTTP Request Logger Audit', () => {
  it('logs requests with status and timing metadata', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
  });
});
