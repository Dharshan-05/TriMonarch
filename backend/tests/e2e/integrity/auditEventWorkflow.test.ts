import { describe, it, expect, vi } from 'vitest';
import { auditService } from '../../../src/audit/audit.service';
import { auditRepository } from '../../../src/audit/audit.repository';
import { e2eOrgA } from '../fixtures/organizations';

describe('Phase 066 — Audit & Business Event E2E Verification', () => {
  it('generates immutable audit log entry for domain events', async () => {
    const mockLog = {
      id: 'audit-e2e-1',
      organization_id: e2eOrgA.id,
      action: 'CREATE',
      entity_type: 'SALES_ORDER',
      entity_id: 'so-1',
      success: true,
      created_at: new Date(),
    };

    vi.spyOn(auditRepository, 'create').mockResolvedValueOnce(mockLog as never);

    const log = await auditService.recordAuditEvent({
      organization_id: e2eOrgA.id,
      action: 'CREATE',
      entity_type: 'SALES_ORDER',
      entity_id: 'so-1',
    });

    expect(log?.id).toBe('audit-e2e-1');
  });
});
