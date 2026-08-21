import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessEventService } from '../src/services/businessEvent.service';
import { auditService } from '../src/audit/audit.service';
import { getBusinessEventDefinition } from '../src/events/businessEvent.registry';

describe('Business Event Service Unit Tests (Phase 040)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const userId = '33333333-3333-3333-3333-333333333333';
  const moId = '44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve event definition from registry correctly', () => {
    const def = getBusinessEventDefinition('MANUFACTURING_ORDER_RELEASED');
    expect(def.action).toBe('UPDATE');
    expect(def.entityType).toBe('MANUFACTURING_ORDER');
    expect(def.category).toBe('CATEGORY_A');
  });

  it('should emit business event and call auditService with correct attributes', async () => {
    const mockAuditLog = {
      id: 'audit-be-1',
      organization_id: orgId,
      user_id: userId,
      category: 'CATEGORY_A' as const,
      action: 'UPDATE' as const,
      entity_type: 'MANUFACTURING_ORDER' as const,
      entity_id: moId,
      request_id: 'req-be-1',
      correlation_id: 'corr-be-1',
      reason: 'MO released to shop floor',
      before_snapshot: { status: 'planned' },
      after_snapshot: { status: 'released' },
      success: true,
      metadata: { event: 'MANUFACTURING_ORDER_RELEASED', mo_number: 'MO-001' },
      created_at: new Date(),
    };

    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce(mockAuditLog);

    const result = await businessEventService.emit({
      eventName: 'MANUFACTURING_ORDER_RELEASED',
      organization_id: orgId,
      user_id: userId,
      entity_id: moId,
      request_id: 'req-be-1',
      correlation_id: 'corr-be-1',
      reason: 'MO released to shop floor',
      before: { status: 'planned' },
      after: { status: 'released' },
      metadata: { mo_number: 'MO-001' },
    });

    expect(result?.id).toBe('audit-be-1');
    expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
      {
        organization_id: orgId,
        user_id: userId,
        category: 'CATEGORY_A',
        action: 'UPDATE',
        entity_type: 'MANUFACTURING_ORDER',
        entity_id: moId,
        request_id: 'req-be-1',
        correlation_id: 'corr-be-1',
        reason: 'MO released to shop floor',
        before_snapshot: { status: 'planned' },
        after_snapshot: { status: 'released' },
        metadata: { event: 'MANUFACTURING_ORDER_RELEASED', mo_number: 'MO-001' },
      },
      undefined,
    );
  });
});
