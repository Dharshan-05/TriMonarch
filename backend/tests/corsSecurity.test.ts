import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Phase 060 — CORS Hardening', () => {
  it('should handle preflight OPTIONS request safely', async () => {
    const response = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(204);
  });
});
