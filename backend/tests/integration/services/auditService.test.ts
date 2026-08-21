import { describe, it, expect, vi } from 'vitest';
import { auditService } from '../../../src/audit/audit.service';
import { auditLogRepository } from '../../../src/repositories/auditLog.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 063 — AuditService Integration Tests', () => {
  it('listAuditLogsByOrganization should return paginated audit logs for matching organization', async () => {
    const mockLogs = {
      items: [
        { id: 'log-1', organization_id: orgAId, action: 'CREATE', entity_type: 'PRODUCT', created_at: new Date() },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

    vi.spyOn(auditLogRepository, 'listByOrganization').mockResolvedValueOnce(mockLogs as unknown as Awaited<ReturnType<typeof auditLogRepository.listByOrganization>>);

    const logs = await auditService.listAuditLogsByOrganization(orgAId);
    expect(logs).toBeDefined();
    expect(logs.items.length).toBe(1);
    expect(logs.items[0].organization_id).toBe(orgAId);
  });
});
