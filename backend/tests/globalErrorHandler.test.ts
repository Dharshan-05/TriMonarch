import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { mapErrorToResponse } from '../src/errors/errorMapper';
import { NotFoundError, ConflictError } from '../src/types';

describe('Phase 058 — Global Error Handling Engine', () => {
  describe('Error Mapper Unit Tests', () => {
    it('should map AppError correctly', () => {
      const err = new ConflictError('Duplicate entity name');
      const mapped = mapErrorToResponse(err);
      expect(mapped.statusCode).toBe(409);
      expect(mapped.code).toBe('CONFLICT');
      expect(mapped.message).toBe('Duplicate entity name');
    });

    it('should map NotFoundError to NOT_FOUND', () => {
      const err = new NotFoundError('Item 123 not found');
      const mapped = mapErrorToResponse(err);
      expect(mapped.statusCode).toBe(404);
      expect(mapped.code).toBe('NOT_FOUND');
      expect(mapped.message).toBe('Item 123 not found');
    });

    it('should map PostgreSQL 23505 (unique violation) to DUPLICATE_RESOURCE', () => {
      const pgErr = { code: '23505', detail: 'Key (email)=(user@test.com) already exists.' };
      const mapped = mapErrorToResponse(pgErr);
      expect(mapped.statusCode).toBe(409);
      expect(mapped.code).toBe('DUPLICATE_RESOURCE');
      expect(mapped.message).toBe('A resource with these details already exists');
    });

    it('should map PostgreSQL 23503 (foreign key violation) to CONFLICT', () => {
      const pgErr = { code: '23503' };
      const mapped = mapErrorToResponse(pgErr);
      expect(mapped.statusCode).toBe(409);
      expect(mapped.code).toBe('CONFLICT');
    });

    it('should map PostgreSQL 08006 (connection failure) to DATABASE_UNAVAILABLE', () => {
      const pgErr = { code: '08006' };
      const mapped = mapErrorToResponse(pgErr);
      expect(mapped.statusCode).toBe(503);
      expect(mapped.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('should map JWT TokenExpiredError to TOKEN_EXPIRED', () => {
      const jwtErr = { name: 'TokenExpiredError', message: 'jwt expired' };
      const mapped = mapErrorToResponse(jwtErr);
      expect(mapped.statusCode).toBe(401);
      expect(mapped.code).toBe('TOKEN_EXPIRED');
    });

    it('should map unknown errors to 500 INTERNAL_SERVER_ERROR', () => {
      const unhandled = new Error('Unexpected null pointer in service');
      const mapped = mapErrorToResponse(unhandled);
      expect(mapped.statusCode).toBe(500);
      expect(mapped.code).toBe('INTERNAL_SERVER_ERROR');
      expect(mapped.message).toBe('An unexpected error occurred');
    });
  });

  describe('HTTP Integration & Security Tests', () => {
    it('GET /api/v1/non-existent-route should return 404 NOT_FOUND with X-Request-ID', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-route')
        .set('X-Request-ID', 'req-test-12345');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.requestId).toBe('req-test-12345');
      expect(response.headers['x-request-id']).toBe('req-test-12345');
    });

    it('POST /api/v1/auth/login with malformed JSON body should return 400 INVALID_JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json payload: ');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_JSON');
    });

    it('Response should never contain internal stack traces or database connection details in error message', async () => {
      const response = await request(app).get('/api/v1/non-existent-route');
      expect(response.body.error.message).not.toContain('node_modules');
      expect(response.body.error.message).not.toContain('postgres://');
      expect(response.body.error.message).not.toContain('SELECT');
    });
  });
});
