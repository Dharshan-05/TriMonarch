import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 075 — Health Endpoint Security Audit', () => {
  it('does not expose connection strings, passwords, or secrets on /health/ready', async () => {
    const res = await request(app).get('/health/ready');
    const bodyStr = JSON.stringify(res.body);

    expect(bodyStr).not.toContain('postgres://');
    expect(bodyStr).not.toContain('password');
    expect(bodyStr).not.toContain('JWT_SECRET');
  });
});
