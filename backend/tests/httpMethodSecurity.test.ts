import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Phase 060 — HTTP Method Security', () => {
  it('TRACE method should be rejected with 405 Method Not Allowed', async () => {
    const response = await request(app).trace('/health');

    expect(response.status).toBe(405);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('METHOD_NOT_ALLOWED');
  });
});
