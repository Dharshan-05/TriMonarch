import { describe, it, expect, vi } from 'vitest';
import { businessEventService } from '../src/services/businessEvent.service';
import { auditService } from '../src/audit/audit.service';

describe('Business Event Concurrency Tests (Phase 040)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const userId = '33333333-3333-3333-3333-333333333333';

  it('Concurrent business event emissions should resolve cleanly without error', async () => {
    vi.spyOn(auditService, 'recordAuditEvent').mockImplementation(async (input) => {
      return {
        id: `audit-be-conc-${Math.random()}`,
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
      businessEventService.emit({
        eventName: 'MANUFACTURING_MATERIAL_CONSUMED',
        organization_id: orgId,
        user_id: userId,
        entity_id: `mo-item-${idx}`,
        metadata: { quantity: '10.0000' },
      }),
    );

    const results = await Promise.all(requests);
    expect(results.length).toBe(10);
    results.forEach((res) => expect(res).not.toBeNull());
  });
});
