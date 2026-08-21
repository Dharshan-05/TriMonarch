import { describe, it, expect, vi } from 'vitest';
import { businessEventService } from '../src/services/businessEvent.service';
import { auditService } from '../src/audit/audit.service';

describe('Business Event Tenant Isolation & Server-side Context Tests (Phase 040)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';

  it('should enforce tenant isolation by passing organization_id to auditService', async () => {
    vi.spyOn(auditService, 'recordAuditEvent').mockImplementation(async (input) => {
      return {
        id: 'audit-tenant-1',
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

    const res = await businessEventService.emit({
      eventName: 'SALES_ORDER_CREATED',
      organization_id: orgAId,
      actor_id: userAId,
      entity_id: '55555555-5555-5555-5555-555555555555',
    });

    expect(res?.organization_id).toBe(orgAId);
    expect(res?.user_id).toBe(userAId);
  });
});
