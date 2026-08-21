import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 075 — Health Endpoint Response Contract Audit', () => {
  it('preserves Docker compatibility on GET /health', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
    expect(res.body.service).toBe('erp-backend');
  });
});
