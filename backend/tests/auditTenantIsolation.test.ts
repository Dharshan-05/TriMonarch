import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { auditService } from '../src/audit/audit.service';
import { signAccessToken } from '../src/utils/jwt';

describe('Audit Tenant Isolation Tests (Phase 039)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const tokenA = signAccessToken(userAId, orgAId).accessToken;

  it('GET /api/v1/audits should query using authenticated JWT organization context', async () => {
    vi.spyOn(auditService, 'listAuditLogsByOrganization').mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    });

    const res = await request(app)
      .get('/api/v1/audits')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(auditService.listAuditLogsByOrganization).toHaveBeenCalledWith(orgAId, expect.anything());
  });

  it('GET /api/v1/audits/:id should not return audit entry belonging to Tenant B', async () => {
    vi.spyOn(auditService, 'getAuditLogById').mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/v1/audits/00000000-0000-0000-0000-000000000099')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(auditService.getAuditLogById).toHaveBeenCalledWith(orgAId, '00000000-0000-0000-0000-000000000099');
  });

  it('GET /api/v1/audits should reject cross-organization header override attempts', async () => {
    const res = await request(app)
      .get('/api/v1/audits')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgBId);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Cross-organization access denied');
  });
});
