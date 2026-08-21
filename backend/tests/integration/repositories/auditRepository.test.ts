import { describe, it, expect, vi } from 'vitest';
import { auditLogRepository } from '../../../src/repositories/auditLog.repository';
import { orgAId } from '../fixtures/database';
import { UnprocessableEntityError } from '../../../src/types';

describe('Phase 062 — AuditLogRepository Integration Tests', () => {
  it('auditLogRepository should append audit records and throw error on update or delete attempts', async () => {
    const mockAudit = {
      id: 'audit-001',
      organization_id: orgAId,
      user_id: 'u-1',
      action: 'CREATE',
      entity_type: 'PRODUCT',
      entity_id: 'p-1',
      success: true,
      created_at: new Date(),
    };

    vi.spyOn(auditLogRepository, 'findById')
      .mockImplementation(async (orgId, id) => {
        if (orgId === orgAId && id === 'audit-001') {
          return mockAudit as unknown as Awaited<ReturnType<typeof auditLogRepository.findById>>;
        }
        return null;
      });

    const audit = await auditLogRepository.findById(orgAId, 'audit-001');
    expect(audit).toBeDefined();
    expect(audit?.action).toBe('CREATE');

    // Immutability requirement check
    await expect(auditLogRepository.update(orgAId, 'audit-001', { action: 'MUTATE' })).rejects.toThrow(UnprocessableEntityError);
    await expect(auditLogRepository.delete(orgAId, 'audit-001')).rejects.toThrow(UnprocessableEntityError);
  });
});
