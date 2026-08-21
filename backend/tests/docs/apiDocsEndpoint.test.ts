import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 076 — API Documentation Endpoints Audit', () => {
  it('GET /openapi.json returns valid JSON OpenAPI 3.1 document', async () => {
    const res = await request(app).get('/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.info.title).toBe('TriMonarch ERP API');
  });

  it('GET /api-docs returns HTML document serving Swagger UI', async () => {
    const res = await request(app).get('/api-docs');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('SwaggerUIBundle');
  });
});
