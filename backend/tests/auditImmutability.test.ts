import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { auditRepository } from '../src/audit/audit.repository';
import { signAccessToken } from '../src/utils/jwt';

describe('Audit Immutability Safety & Defense Tests (Phase 039)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const userId = '33333333-3333-3333-3333-333333333333';
  const token = signAccessToken(userId, orgId).accessToken;

  it('Application Layer: repository.update() MUST throw an explicit immutability error', async () => {
    await expect(auditRepository.update()).rejects.toThrow('Audit records are immutable and cannot be updated');
  });

  it('Application Layer: repository.delete() MUST throw an explicit immutability error', async () => {
    await expect(auditRepository.delete(orgId, 'audit-id')).rejects.toThrow('Audit records are immutable and cannot be deleted');
  });

  it('API Layer: NO POST endpoint exposed on /api/v1/audits to forge arbitrary audit entries', async () => {
    const postRes = await request(app)
      .post('/api/v1/audits')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'FORGED_ENTRY' });
    expect(postRes.status).toBe(404);
  });

  it('API Layer: NO PUT or PATCH endpoints exposed on /api/v1/audits/:id', async () => {
    const patchRes = await request(app)
      .patch('/api/v1/audits/audit-123')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'MUTATION' });
    expect(patchRes.status).toBe(404);

    const putRes = await request(app)
      .put('/api/v1/audits/audit-123')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'MUTATION' });
    expect(putRes.status).toBe(404);
  });

  it('API Layer: NO DELETE endpoint exposed on /api/v1/audits/:id', async () => {
    const deleteRes = await request(app)
      .delete('/api/v1/audits/audit-123')
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(404);
  });
});
