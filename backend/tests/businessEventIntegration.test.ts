import { describe, it, expect, vi } from 'vitest';
import { businessEventService } from '../src/services/businessEvent.service';
import { auditService } from '../src/audit/audit.service';

describe('Business Event Integration Across Modules (Phase 040)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const userId = '33333333-3333-3333-3333-333333333333';

  it('should emit correct business event across Manufacturing Production lifecycle', async () => {
    vi.spyOn(auditService, 'recordAuditEvent').mockImplementation(async (input) => {
      return {
        id: 'audit-integ-1',
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
      eventName: 'MANUFACTURING_PRODUCTION_RECORDED',
      organization_id: orgId,
      user_id: userId,
      entity_id: 'prod-rec-001',
      metadata: { production_number: 'PROD-001', quantity: '50.0000' },
    });

    expect(res?.entity_type).toBe('MANUFACTURING_PRODUCTION');
    expect(res?.category).toBe('CATEGORY_A');
    expect(res?.action).toBe('UPDATE');
  });
});
