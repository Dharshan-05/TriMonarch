import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { bomService } from '../src/services/bom.service';
import { signAccessToken } from '../src/utils/jwt';
import {
  BomProductNotFoundError,
  BomDuplicateComponentError,
  BomCircularDependencyError,
} from '../src/types';

describe('Phase 054 — BOM Management REST API (/api/v1/boms)', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgA = '22222222-2222-2222-2222-222222222222';
  const bomId = '33333333-3333-3333-3333-333333333333';
  const productId = '44444444-4444-4444-4444-444444444444';
  const compProductId = '55555555-5555-5555-5555-555555555555';
  const componentId = '66666666-6666-6666-6666-666666666666';
  const { accessToken } = signAccessToken(adminUserId, orgA);

  describe('Authentication & Security', () => {
    it('GET /api/v1/boms without JWT should return 401 Unauthorized', async () => {
      const response = await request(app).get('/api/v1/boms');
      expect(response.status).toBe(401);
    });

    it('GET /api/v1/boms with invalid JWT should return 401 Unauthorized', async () => {
      const response = await request(app)
        .get('/api/v1/boms')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(401);
    });
  });

  describe('BOM CRUD Operations', () => {
    it('GET /api/v1/boms should list BOMs for authenticated tenant', async () => {
      vi.spyOn(bomService, 'listBoms').mockResolvedValueOnce({
        items: [
          {
            id: bomId,
            organization_id: orgA,
            product_id: productId,
            bom_number: 'BOM-001',
            revision: '1',
            version: 1,
            name: 'Motor Assembly',
            status: 'draft',
            effective_from: null,
            effective_to: null,
            is_default: false,
            notes: null,
            created_by: adminUserId,
            updated_by: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });

      const response = await request(app)
        .get('/api/v1/boms?page=1&pageSize=20')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].bom_number).toBe('BOM-001');
    });

    it('POST /api/v1/boms should create a new BOM and return 201 Created', async () => {
      vi.spyOn(bomService, 'createBom').mockResolvedValueOnce({
        id: bomId,
        organization_id: orgA,
        product_id: productId,
        bom_number: 'BOM-001',
        revision: '1',
        version: 1,
        name: 'Motor Assembly',
        status: 'draft',
        effective_from: null,
        effective_to: null,
        is_default: false,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [
          {
            id: componentId,
            organization_id: orgA,
            bom_id: bomId,
            component_product_id: compProductId,
            quantity: '2.0000',
            unit: 'pcs',
            scrap_percentage: '0.00',
            sequence: 1,
            notes: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        bom_material_cost: '50.0000',
      });

      const response = await request(app)
        .post('/api/v1/boms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: productId,
          bom_number: 'BOM-001',
          components: [
            {
              component_product_id: compProductId,
              quantity: 2,
              unit: 'pcs',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(bomId);
    });

    it('GET /api/v1/boms/:id should return single BOM details with material cost', async () => {
      vi.spyOn(bomService, 'getBom').mockResolvedValueOnce({
        id: bomId,
        organization_id: orgA,
        product_id: productId,
        bom_number: 'BOM-001',
        revision: '1',
        version: 1,
        name: 'Motor Assembly',
        status: 'draft',
        effective_from: null,
        effective_to: null,
        is_default: false,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
        bom_material_cost: '100.0000',
      });

      const response = await request(app)
        .get(`/api/v1/boms/${bomId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bom_material_cost).toBe('100.0000');
    });

    it('DELETE /api/v1/boms/:id should delete draft BOM', async () => {
      vi.spyOn(bomService, 'getBom').mockResolvedValueOnce({
        id: bomId,
        organization_id: orgA,
        product_id: productId,
        bom_number: 'BOM-001',
        revision: '1',
        version: 1,
        name: 'Motor Assembly',
        status: 'draft',
        effective_from: null,
        effective_to: null,
        is_default: false,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      vi.spyOn(bomService, 'deleteBom').mockResolvedValueOnce(true);

      const response = await request(app)
        .delete(`/api/v1/boms/${bomId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Validation & Circular Dependency Protection', () => {
    it('POST /api/v1/boms should reject non-existent parent product with 404', async () => {
      vi.spyOn(bomService, 'createBom').mockRejectedValueOnce(
        new BomProductNotFoundError(`Product with ID ${productId} not found`),
      );

      const response = await request(app)
        .post('/api/v1/boms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: productId,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('POST /api/v1/boms should reject circular BOM dependency with 400', async () => {
      vi.spyOn(bomService, 'createBom').mockRejectedValueOnce(
        new BomCircularDependencyError('Circular dependency detected in BOM structure'),
      );

      const response = await request(app)
        .post('/api/v1/boms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: productId,
          components: [
            {
              component_product_id: compProductId,
              quantity: 1,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('BOM_CIRCULAR_DEPENDENCY');
    });

    it('POST /api/v1/boms/:id/components should reject duplicate components with 409', async () => {
      vi.spyOn(bomService, 'getBom').mockResolvedValueOnce({
        id: bomId,
        organization_id: orgA,
        product_id: productId,
        bom_number: 'BOM-001',
        revision: '1',
        status: 'draft',
        effective_from: null,
        effective_to: null,
        is_default: false,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      vi.spyOn(bomService, 'addComponent').mockRejectedValueOnce(
        new BomDuplicateComponentError(`Component product ${compProductId} already exists in this BOM`),
      );

      const response = await request(app)
        .post(`/api/v1/boms/${bomId}/components`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          component_product_id: compProductId,
          quantity: 1,
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_BOM_COMPONENT');
    });
  });

  describe('Workflows, Revisions & State Machine', () => {
    it('POST /api/v1/boms/:id/activate should activate BOM', async () => {
      vi.spyOn(bomService, 'getBom').mockResolvedValueOnce({
        id: bomId,
        organization_id: orgA,
        product_id: productId,
        bom_number: 'BOM-001',
        revision: '1',
        status: 'draft',
        effective_from: null,
        effective_to: null,
        is_default: false,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      vi.spyOn(bomService, 'activateBom').mockResolvedValueOnce({
        id: bomId,
        organization_id: orgA,
        product_id: productId,
        bom_number: 'BOM-001',
        revision: '1',
        status: 'active',
        effective_from: null,
        effective_to: null,
        is_default: false,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const response = await request(app)
        .post(`/api/v1/boms/${bomId}/activate`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('POST /api/v1/boms/:id/revision should create new draft revision', async () => {
      vi.spyOn(bomService, 'getBom').mockResolvedValueOnce({
        id: bomId,
        organization_id: orgA,
        product_id: productId,
        bom_number: 'BOM-001',
        revision: '1',
        status: 'active',
        effective_from: null,
        effective_to: null,
        is_default: true,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      vi.spyOn(bomService, 'createRevision').mockResolvedValueOnce({
        id: '77777777-7777-7777-7777-777777777777',
        organization_id: orgA,
        product_id: productId,
        bom_number: 'BOM-002',
        revision: '2',
        status: 'draft',
        effective_from: null,
        effective_to: null,
        is_default: false,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      const response = await request(app)
        .post(`/api/v1/boms/${bomId}/revision`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.revision).toBe('2');
    });
  });
});
