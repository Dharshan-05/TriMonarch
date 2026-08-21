import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { auditService } from '../src/audit/audit.service';
import { signAccessToken } from '../src/utils/jwt';

describe('Audit Integration & Entity History Queries (Phase 039)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const moId = '44444444-4444-4444-4444-444444444444';
  const tokenA = signAccessToken(userAId, orgAId).accessToken;

  it('GET /api/v1/audits/entity/MANUFACTURING_ORDER/:entityId should return entity audit history', async () => {
    vi.spyOn(auditService, 'getEntityAuditHistory').mockResolvedValueOnce({
      items: [
        {
          id: 'audit-e1',
          organization_id: orgAId,
          user_id: userAId,
          category: 'CATEGORY_A',
          action: 'UPDATE',
          entity_type: 'MANUFACTURING_ORDER',
          entity_id: moId,
          request_id: 'req-e1',
          correlation_id: null,
          reason: 'MO started',
          before_snapshot: { status: 'released' },
          after_snapshot: { status: 'in_progress' },
          success: true,
          metadata: { event: 'MANUFACTURING_ORDER_STARTED' },
          created_at: new Date(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });

    const res = await request(app)
      .get(`/api/v1/audits/entity/MANUFACTURING_ORDER/${moId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].entity_id).toBe(moId);
    expect(auditService.getEntityAuditHistory).toHaveBeenCalledWith(orgAId, 'MANUFACTURING_ORDER', moId, expect.anything());
  });

  it('GET /api/v1/audits/actor/:actorId should return actor audit history', async () => {
    vi.spyOn(auditService, 'getActorAuditHistory').mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    });

    const res = await request(app)
      .get(`/api/v1/audits/actor/${userAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(auditService.getActorAuditHistory).toHaveBeenCalledWith(orgAId, userAId, expect.anything());
  });
});
