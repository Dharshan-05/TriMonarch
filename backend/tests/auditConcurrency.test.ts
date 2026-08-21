import { describe, it, expect, vi } from 'vitest';
import { auditService } from '../src/audit/audit.service';
import { auditRepository } from '../src/audit/audit.repository';

describe('Audit Concurrency Tests (Phase 039)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const userId = '33333333-3333-3333-3333-333333333333';

  it('Concurrent audit creation should resolve cleanly without error', async () => {
    vi.spyOn(auditRepository, 'create').mockImplementation(async (input) => {
      return {
        id: `audit-conc-${Math.random()}`,
        organization_id: input.organization_id,
        user_id: input.user_id || null,
        category: input.category || 'CATEGORY_A',
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id || null,
        request_id: input.request_id || null,
        correlation_id: input.correlation_id || null,
        reason: input.reason || null,
        before_snapshot: null,
        after_snapshot: null,
        success: true,
        metadata: input.metadata || {},
        created_at: new Date(),
      };
    });

    const requests = Array.from({ length: 10 }).map((_, idx) =>
      auditService.recordAuditEvent({
        organization_id: orgId,
        user_id: userId,
        action: 'UPDATE',
        entity_type: 'MANUFACTURING_ORDER',
        entity_id: `mo-${idx}`,
      }),
    );

    const results = await Promise.all(requests);
    expect(results.length).toBe(10);
    results.forEach((res) => expect(res).not.toBeNull());
  });
});
