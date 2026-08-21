import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { sendSuccess, sendCreated, sendPaginated, sanitizeResponseData } from '../src/utils/response';
import { productService } from '../src/services/product.service';
import { signAccessToken } from '../src/utils/jwt';
import { Response } from 'express';

describe('Phase 059 — API Response Standardization Engine', () => {
  describe('DTO & Sensitive Field Sanitization', () => {
    it('should strip sensitive keys from response DTO objects', () => {
      const input = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'secret_hash_value',
        accessToken: 'jwt_access_token',
        profile: {
          name: 'John Doe',
          secret: 'user_secret_key',
        },
      };

      const sanitized = sanitizeResponseData(input);
      expect(sanitized).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        profile: {
          name: 'John Doe',
        },
      });
      expect(sanitized).not.toHaveProperty('passwordHash');
      expect(sanitized).not.toHaveProperty('accessToken');
    });

    it('should strip sensitive keys from nested array elements', () => {
      const input = [
        { id: 1, name: 'Alice', refreshToken: 'tok_1' },
        { id: 2, name: 'Bob', refreshToken: 'tok_2' },
      ];

      const sanitized = sanitizeResponseData(input);
      expect(sanitized).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
    });
  });

  describe('Response Serializer Unit Tests', () => {
    it('sendSuccess should format standard success response structure', () => {
      const mockRes = {
        status: (code: number) => {
          expect(code).toBe(200);
          return mockRes;
        },
        json: (body: unknown) => {
          expect(body).toMatchObject({
            success: true,
            data: { message: 'hello' },
            meta: {
              apiVersion: 'v1',
            },
          });
          return mockRes;
        },
        req: { id: 'req-123' },
      } as unknown as Response;

      sendSuccess(mockRes, { message: 'hello' });
    });

    it('sendCreated should set 201 status and Location header', () => {
      let locationHeaderValue: string | undefined;
      const mockRes = {
        setHeader: (name: string, value: string) => {
          if (name === 'Location') locationHeaderValue = value;
          return mockRes;
        },
        status: (code: number) => {
          expect(code).toBe(201);
          return mockRes;
        },
        json: (body: unknown) => {
          expect(body).toMatchObject({
            success: true,
            data: { id: 'new-id' },
          });
          return mockRes;
        },
        req: { id: 'req-123' },
      } as unknown as Response;

      sendCreated(mockRes, { id: 'new-id' }, '/api/v1/products/new-id');
      expect(locationHeaderValue).toBe('/api/v1/products/new-id');
    });

    it('sendPaginated should calculate pagination metadata correctly for page 1 of 3', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const mockRes = {
        status: (code: number) => {
          expect(code).toBe(200);
          return mockRes;
        },
        json: (body: Record<string, unknown>) => {
          expect(body.success).toBe(true);
          expect(body.data).toEqual(items);
          expect(body.meta).toMatchObject({
            pagination: {
              page: 1,
              pageSize: 10,
              totalItems: 25,
              totalPages: 3,
              hasNextPage: true,
              hasPreviousPage: false,
            },
          });
          return mockRes;
        },
        req: { id: 'req-123' },
      } as unknown as Response;

      sendPaginated(mockRes, items, 1, 10, 25);
    });

    it('sendPaginated should handle zero totalItems correctly', () => {
      const mockRes = {
        status: (code: number) => {
          expect(code).toBe(200);
          return mockRes;
        },
        json: (body: Record<string, unknown>) => {
          expect(body.success).toBe(true);
          expect(body.data).toEqual([]);
          expect(body.meta).toMatchObject({
            pagination: {
              page: 1,
              pageSize: 20,
              totalItems: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          });
          return mockRes;
        },
        req: { id: 'req-123' },
      } as unknown as Response;

      sendPaginated(mockRes, [], 1, 20, 0);
    });
  });

  describe('HTTP API End-to-End Correlation Tests', () => {
    it('GET /api/v1/products should return standardized success and pagination meta', async () => {
      const adminUserId = '11111111-1111-1111-1111-111111111111';
      const orgId = '22222222-2222-2222-2222-222222222222';
      const { accessToken } = signAccessToken(adminUserId, orgId);

      vi.spyOn(productService, 'searchProducts').mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });

      const response = await request(app)
        .get('/api/v1/products?page=1&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Request-ID', 'req-corr-999');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBe('req-corr-999');
    });
  });
});
