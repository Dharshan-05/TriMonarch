import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { auditService } from '../src/audit/audit.service';
import { signAccessToken } from '../src/utils/jwt';
import { AuditLog } from '../src/audit/audit.types';

describe('Phase 056 — Audit Management REST API (/api/v1/audit)', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgA = '22222222-2222-2222-2222-222222222222';
  const auditId = '33333333-3333-3333-3333-333333333333';
  const { accessToken } = signAccessToken(adminUserId, orgA);

  const mockAuditRecord: AuditLog = {
    id: auditId,
    organization_id: orgA,
    user_id: adminUserId,
    category: 'CATEGORY_A',
    action: 'CREATE',
    entity_type: 'PRODUCT',
    entity_id: '44444444-4444-4444-4444-444444444444',
    request_id: 'req-123',
    correlation_id: 'corr-123',
    reason: null,
    before_snapshot: null,
    after_snapshot: { name: 'Widget A' },
    success: true,
    metadata: { event: 'PRODUCT_CREATED' },
    created_at: new Date(),
  };

  describe('Authentication & Security', () => {
    it('GET /api/v1/audit without JWT should return 401 Unauthorized', async () => {
      const response = await request(app).get('/api/v1/audit');
      expect(response.status).toBe(401);
    });

    it('GET /api/v1/audit with invalid JWT should return 401 Unauthorized', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(401);
    });
  });

  describe('Audit Query & Discovery Endpoints', () => {
    it('GET /api/v1/audit should list tenant audit records with pagination', async () => {
      vi.spyOn(auditService, 'listAuditLogsByOrganization').mockResolvedValueOnce({
        items: [mockAuditRecord],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });

      const response = await request(app)
        .get('/api/v1/audit?page=1&pageSize=20')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(auditId);
    });

    it('GET /api/v1/audit/:id should return single audit record details', async () => {
      vi.spyOn(auditService, 'getAuditLogById').mockResolvedValueOnce(mockAuditRecord);

      const response = await request(app)
        .get(`/api/v1/audit/${auditId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(auditId);
    });

    it('GET /api/v1/audit/events should return available audit event types', async () => {
      vi.spyOn(auditService, 'getAvailableEventTypes').mockResolvedValueOnce(['PRODUCT_CREATED', 'USER_LOGIN']);

      const response = await request(app)
        .get('/api/v1/audit/events')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toContain('PRODUCT_CREATED');
    });

    it('GET /api/v1/audit/stats should return tenant audit metrics aggregation', async () => {
      vi.spyOn(auditService, 'getStats').mockResolvedValueOnce({
        totalEvents: 42,
        eventsByAction: [{ action: 'CREATE', count: 10 }],
        eventsByResource: [{ resource: 'PRODUCT', count: 10 }],
        eventsByUser: [{ userId: adminUserId, count: 42 }],
      });

      const response = await request(app)
        .get('/api/v1/audit/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalEvents).toBe(42);
    });

    it('GET /api/v1/audit/actor/:userId should return audit history for specified user', async () => {
      vi.spyOn(auditService, 'getActorAuditHistory').mockResolvedValueOnce({
        items: [mockAuditRecord],
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      });

      const response = await request(app)
        .get(`/api/v1/audit/actor/${adminUserId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('GET /api/v1/audit/resource/products/:resourceId should return resource audit history', async () => {
      vi.spyOn(auditService, 'getEntityAuditHistory').mockResolvedValueOnce({
        items: [mockAuditRecord],
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      });

      const response = await request(app)
        .get(`/api/v1/audit/resource/products/44444444-4444-4444-4444-444444444444`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('GET /api/v1/audit/export should export tenant audit records', async () => {
      vi.spyOn(auditService, 'exportAuditLogs').mockResolvedValueOnce([mockAuditRecord]);

      const response = await request(app)
        .get('/api/v1/audit/export?format=json')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('Immutability Protections', () => {
    it('PATCH /api/v1/audit/:id should be rejected with 404 Not Found', async () => {
      const response = await request(app)
        .patch(`/api/v1/audit/${auditId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reason: 'tamper' });

      expect(response.status).toBe(404);
    });

    it('DELETE /api/v1/audit/:id should be rejected with 404 Not Found', async () => {
      const response = await request(app)
        .delete(`/api/v1/audit/${auditId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });
});
