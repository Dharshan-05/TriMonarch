import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';

describe('Phase 057 — Centralized Request Validation Engine', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgId = '22222222-2222-2222-2222-222222222222';
  const { accessToken } = signAccessToken(adminUserId, orgId);

  describe('Path Parameter & UUID Validation', () => {
    it('GET /api/v1/users/not-a-uuid should return 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .get('/api/v1/users/not-a-uuid')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/v1/products/invalid-uuid should return 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .get('/api/v1/products/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/v1/boms/12345 should return 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .get('/api/v1/boms/12345')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Query Parameter Validation', () => {
    it('GET /api/v1/products?page=abc should return 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=abc')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/v1/products?status=INVALID_STATUS should return 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .get('/api/v1/products?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Request Body & Schema Validation', () => {
    it('POST /api/v1/products with missing required fields should return 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Missing name and SKU',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/products with negative price should return 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Widget X',
          sku: 'SKU-WIDGET-X',
          price: -19.99,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/auth/login with invalid email format should return 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Date & Range Validation', () => {
    it('POST /api/v1/manufacturing with start date after end date should return 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/api/v1/manufacturing')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: '44444444-4444-4444-4444-444444444444',
          bom_id: '55555555-5555-5555-5555-555555555555',
          warehouse_id: '66666666-6666-6666-6666-666666666666',
          planned_quantity: 10,
          planned_start_date: '2026-12-31T00:00:00.000Z',
          planned_end_date: '2026-01-01T00:00:00.000Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Prototype Pollution Protection', () => {
    it('POST /api/v1/products containing __proto__ key should return 400 VALIDATION_ERROR', async () => {
      const rawJson = '{"name": "Widget Pollution", "sku": "SKU-POLLUTE", "price": 10.0, "__proto__": {"isAdmin": true}}';
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send(rawJson);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

