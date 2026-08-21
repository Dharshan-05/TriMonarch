import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { manufacturingOrderService } from '../src/services/manufacturingOrder.service';
import { signAccessToken } from '../src/utils/jwt';
import {
  ManufacturingOrderProductMismatchError,
  InvalidManufacturingOrderStateTransitionError,
} from '../src/types';

describe('Phase 055 — Manufacturing Management REST API (/api/v1/manufacturing)', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgA = '22222222-2222-2222-2222-222222222222';
  const moId = '33333333-3333-3333-3333-333333333333';
  const productId = '44444444-4444-4444-4444-444444444444';
  const bomId = '55555555-5555-5555-5555-555555555555';
  const warehouseId = '66666666-6666-6666-6666-666666666666';
  const { accessToken } = signAccessToken(adminUserId, orgA);

  describe('Authentication & Security', () => {
    it('GET /api/v1/manufacturing without JWT should return 401 Unauthorized', async () => {
      const response = await request(app).get('/api/v1/manufacturing');
      expect(response.status).toBe(401);
    });

    it('GET /api/v1/manufacturing with invalid JWT should return 401 Unauthorized', async () => {
      const response = await request(app)
        .get('/api/v1/manufacturing')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(401);
    });
  });

  describe('Manufacturing Order CRUD Operations', () => {
    it('GET /api/v1/manufacturing should list manufacturing orders for authenticated tenant', async () => {
      vi.spyOn(manufacturingOrderService, 'listOrders').mockResolvedValueOnce({
        items: [
          {
            id: moId,
            organization_id: orgA,
            order_number: 'MO-202608-001',
            mo_number: 'MO-202608-001',
            product_id: productId,
            bom_id: bomId,
            warehouse_id: warehouseId,
            planned_quantity: '10.0000',
            completed_quantity: '0.0000',
            produced_quantity: '0.0000',
            consumed_quantity: '0.0000',
            scrapped_quantity: '0.0000',
            unit: 'pcs',
            status: 'draft',
            priority: 'normal',
            scheduled_start_date: null,
            scheduled_end_date: null,
            planned_start_date: null,
            planned_end_date: null,
            actual_start_date: null,
            actual_end_date: null,
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
        .get('/api/v1/manufacturing?page=1&pageSize=20')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].order_number).toBe('MO-202608-001');
    });

    it('POST /api/v1/manufacturing should create a manufacturing order and return 201 Created', async () => {
      vi.spyOn(manufacturingOrderService, 'createOrder').mockResolvedValueOnce({
        id: moId,
        organization_id: orgA,
        order_number: 'MO-202608-001',
        mo_number: 'MO-202608-001',
        product_id: productId,
        bom_id: bomId,
        warehouse_id: warehouseId,
        planned_quantity: '10.0000',
        completed_quantity: '0.0000',
        produced_quantity: '0.0000',
        consumed_quantity: '0.0000',
        scrapped_quantity: '0.0000',
        unit: 'pcs',
        status: 'draft',
        priority: 'normal',
        scheduled_start_date: null,
        scheduled_end_date: null,
        planned_start_date: null,
        planned_end_date: null,
        actual_start_date: null,
        actual_end_date: null,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      const response = await request(app)
        .post('/api/v1/manufacturing')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: productId,
          bom_id: bomId,
          warehouse_id: warehouseId,
          planned_quantity: 10,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(moId);
    });

    it('GET /api/v1/manufacturing/:id should return manufacturing order details', async () => {
      vi.spyOn(manufacturingOrderService, 'getOrder').mockResolvedValueOnce({
        id: moId,
        organization_id: orgA,
        order_number: 'MO-202608-001',
        mo_number: 'MO-202608-001',
        product_id: productId,
        bom_id: bomId,
        warehouse_id: warehouseId,
        planned_quantity: '10.0000',
        completed_quantity: '0.0000',
        produced_quantity: '0.0000',
        consumed_quantity: '0.0000',
        scrapped_quantity: '0.0000',
        unit: 'pcs',
        status: 'draft',
        priority: 'normal',
        scheduled_start_date: null,
        scheduled_end_date: null,
        planned_start_date: null,
        planned_end_date: null,
        actual_start_date: null,
        actual_end_date: null,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      const response = await request(app)
        .get(`/api/v1/manufacturing/${moId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order_number).toBe('MO-202608-001');
    });

    it('DELETE /api/v1/manufacturing/:id should delete draft manufacturing order', async () => {
      vi.spyOn(manufacturingOrderService, 'getOrder').mockResolvedValueOnce({
        id: moId,
        organization_id: orgA,
        order_number: 'MO-202608-001',
        mo_number: 'MO-202608-001',
        product_id: productId,
        bom_id: bomId,
        warehouse_id: warehouseId,
        planned_quantity: '10.0000',
        completed_quantity: '0.0000',
        produced_quantity: '0.0000',
        consumed_quantity: '0.0000',
        scrapped_quantity: '0.0000',
        unit: 'pcs',
        status: 'draft',
        priority: 'normal',
        scheduled_start_date: null,
        scheduled_end_date: null,
        planned_start_date: null,
        planned_end_date: null,
        actual_start_date: null,
        actual_end_date: null,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      vi.spyOn(manufacturingOrderService, 'deleteOrder').mockResolvedValueOnce(true);

      const response = await request(app)
        .delete(`/api/v1/manufacturing/${moId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('BOM Validation & Material Requirements', () => {
    it('POST /api/v1/manufacturing should reject BOM/Product mismatch with 400', async () => {
      vi.spyOn(manufacturingOrderService, 'createOrder').mockRejectedValueOnce(
        new ManufacturingOrderProductMismatchError('BOM does not match requested product'),
      );

      const response = await request(app)
        .post('/api/v1/manufacturing')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: productId,
          bom_id: bomId,
          warehouse_id: warehouseId,
          planned_quantity: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MANUFACTURING_ORDER_PRODUCT_MISMATCH');
    });

    it('GET /api/v1/manufacturing/:id/materials should return component material availability', async () => {
      vi.spyOn(manufacturingOrderService, 'getOrder').mockResolvedValueOnce({
        id: moId,
        organization_id: orgA,
        order_number: 'MO-202608-001',
        mo_number: 'MO-202608-001',
        product_id: productId,
        bom_id: bomId,
        warehouse_id: warehouseId,
        planned_quantity: '10.0000',
        completed_quantity: '0.0000',
        produced_quantity: '0.0000',
        consumed_quantity: '0.0000',
        scrapped_quantity: '0.0000',
        unit: 'pcs',
        status: 'planned',
        priority: 'normal',
        scheduled_start_date: null,
        scheduled_end_date: null,
        planned_start_date: null,
        planned_end_date: null,
        actual_start_date: null,
        actual_end_date: null,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      vi.spyOn(manufacturingOrderService, 'getMaterials').mockResolvedValueOnce({
        availabilityStatus: 'available',
        materials: [
          {
            component: 'COMP-001',
            product_id: '77777777-7777-7777-7777-777777777777',
            requiredQuantity: '20.0000',
            availableQuantity: '50.0000',
            reservedQuantity: '0.0000',
            consumedQuantity: '0.0000',
            shortageQuantity: '0.0000',
            availabilityStatus: 'available',
          },
        ],
      });

      const response = await request(app)
        .get(`/api/v1/manufacturing/${moId}/materials`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availabilityStatus).toBe('available');
    });
  });

  describe('State Machine & Transitions', () => {
    it('POST /api/v1/manufacturing/:id/release should release planned manufacturing order', async () => {
      vi.spyOn(manufacturingOrderService, 'getOrder').mockResolvedValueOnce({
        id: moId,
        organization_id: orgA,
        order_number: 'MO-202608-001',
        mo_number: 'MO-202608-001',
        product_id: productId,
        bom_id: bomId,
        warehouse_id: warehouseId,
        planned_quantity: '10.0000',
        completed_quantity: '0.0000',
        produced_quantity: '0.0000',
        consumed_quantity: '0.0000',
        scrapped_quantity: '0.0000',
        unit: 'pcs',
        status: 'planned',
        priority: 'normal',
        scheduled_start_date: null,
        scheduled_end_date: null,
        planned_start_date: null,
        planned_end_date: null,
        actual_start_date: null,
        actual_end_date: null,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      vi.spyOn(manufacturingOrderService, 'releaseOrder').mockResolvedValueOnce({
        id: moId,
        organization_id: orgA,
        order_number: 'MO-202608-001',
        mo_number: 'MO-202608-001',
        product_id: productId,
        bom_id: bomId,
        warehouse_id: warehouseId,
        planned_quantity: '10.0000',
        completed_quantity: '0.0000',
        produced_quantity: '0.0000',
        consumed_quantity: '0.0000',
        scrapped_quantity: '0.0000',
        unit: 'pcs',
        status: 'released',
        priority: 'normal',
        scheduled_start_date: null,
        scheduled_end_date: null,
        planned_start_date: null,
        planned_end_date: null,
        actual_start_date: null,
        actual_end_date: null,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const response = await request(app)
        .post(`/api/v1/manufacturing/${moId}/release`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('released');
    });

    it('POST /api/v1/manufacturing/:id/start should reject invalid state transition with 400', async () => {
      vi.spyOn(manufacturingOrderService, 'getOrder').mockResolvedValueOnce({
        id: moId,
        organization_id: orgA,
        order_number: 'MO-202608-001',
        mo_number: 'MO-202608-001',
        product_id: productId,
        bom_id: bomId,
        warehouse_id: warehouseId,
        planned_quantity: '10.0000',
        completed_quantity: '0.0000',
        produced_quantity: '0.0000',
        consumed_quantity: '0.0000',
        scrapped_quantity: '0.0000',
        unit: 'pcs',
        status: 'draft',
        priority: 'normal',
        scheduled_start_date: null,
        scheduled_end_date: null,
        planned_start_date: null,
        planned_end_date: null,
        actual_start_date: null,
        actual_end_date: null,
        notes: null,
        created_by: adminUserId,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      });

      vi.spyOn(manufacturingOrderService, 'startOrder').mockRejectedValueOnce(
        new InvalidManufacturingOrderStateTransitionError('draft', 'in_progress'),
      );

      const response = await request(app)
        .post(`/api/v1/manufacturing/${moId}/start`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_MANUFACTURING_ORDER_STATE_TRANSITION');
    });
  });
});
