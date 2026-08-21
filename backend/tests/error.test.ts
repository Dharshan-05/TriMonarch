import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Error Handling Middleware', () => {
  it('should return 404 with structured JSON response for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-endpoint-123');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toBe('Route GET /api/unknown-endpoint-123 not found');
  });
});
