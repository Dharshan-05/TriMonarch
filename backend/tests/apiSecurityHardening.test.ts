import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';
import { productService } from '../src/services/product.service';

describe('Phase 060 — Comprehensive API Security Hardening', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgId = '22222222-2222-2222-2222-222222222222';
  const { accessToken } = signAccessToken(adminUserId, orgId);

  describe('Nested Prototype Pollution Defense', () => {
    it('POST /api/v1/products with nested constructor/prototype property should return 400 VALIDATION_ERROR', async () => {
      vi.spyOn(productService, 'createProduct').mockResolvedValueOnce({
        id: 'prod-123',
        organization_id: orgId,
        sku: 'SKU-NESTED-POLLUTION',
        name: 'Nested Pollution Product',
        description: null,
        category: null,
        unit: 'pcs',
        price: '99.99',
        cost: '49.99',
        tax_rate: '0.05',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const rawPayload = '{"name": "Nested Pollution Product", "sku": "SKU-NESTED-POLLUTION", "price": "99.99", "nested": {"constructor": {"prototype": {"isAdmin": true}}}}';

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send(rawPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Rate Limiting & Rate Limit Response Headers', () => {
    it('GET /health should include X-RateLimit headers', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });
});
