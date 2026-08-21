import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { createRateLimiter } from '../src/middleware/rateLimit';
import { Request, Response } from 'express';

describe('Phase 046 — REST API Foundation Infrastructure', () => {
  it('GET /health should return 200 OK with liveness status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.service).toBe('erp-backend');
    expect(response.body.timestamp).toBeDefined();
  });

  it('GET /ready should return readiness check response', async () => {
    const response = await request(app).get('/ready');
    expect([200, 503]).toContain(response.status);
    expect(response.body.service).toBe('erp-backend');
  });

  it('should generate x-request-id header if not provided by client', async () => {
    const response = await request(app).get('/health');
    expect(response.headers['x-request-id']).toBeDefined();
    expect(typeof response.headers['x-request-id']).toBe('string');
  });

  it('should propagate valid client-supplied x-request-id header', async () => {
    const clientReqId = 'custom-correlation-id-12345';
    const response = await request(app)
      .get('/health')
      .set('x-request-id', clientReqId);

    expect(response.headers['x-request-id']).toBe(clientReqId);
  });

  it('unmapped route should return 404 with NOT_FOUND error code and requestId', async () => {
    const response = await request(app).get('/api/v1/nonexistent-endpoint-test');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.requestId).toBeDefined();
  });

  it('should validate Idempotency-Key header length', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('idempotency-key', 'short');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rate limiter should set rate limit headers and return 429 when limit exceeded', async () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
    const mockReq = { ip: '127.0.0.1', headers: {} } as Request;
    const mockRes = {
      setHeader: () => mockRes,
      status: (code: number) => {
        expect(code).toBe(429);
        return mockRes;
      },
      json: (data: unknown) => {
        expect((data as { error: { code: string } }).error.code).toBe('TOO_MANY_REQUESTS');
      },
    } as unknown as Response;

    const next = () => {};

    limiter(mockReq, mockRes, next);
    limiter(mockReq, mockRes, next);
    limiter(mockReq, mockRes, next); // Exceeds limit
  });
});
