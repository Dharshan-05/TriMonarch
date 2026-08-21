import { describe, it, expect, vi } from 'vitest';
import { businessEventService } from '../src/services/businessEvent.service';
import { auditService } from '../src/audit/audit.service';

describe('Business Event Sanitization & Security Tests (Phase 040)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const userId = '33333333-3333-3333-3333-333333333333';

  it('should automatically redact sensitive tokens, passwords, and keys from business event payloads', async () => {
    vi.spyOn(auditService, 'recordAuditEvent').mockImplementation(async (input) => {
      return {
        id: 'audit-san-1',
        organization_id: input.organization_id,
        user_id: input.user_id || null,
        category: input.category || 'CATEGORY_A',
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id || null,
        request_id: input.request_id || null,
        correlation_id: input.correlation_id || null,
        reason: input.reason || null,
        before_snapshot: input.before_snapshot || null,
        after_snapshot: input.after_snapshot || null,
        success: input.success ?? true,
        metadata: input.metadata || {},
        created_at: new Date(),
      };
    });

    const result = await businessEventService.emit({
      eventName: 'USER_UPDATED',
      organization_id: orgId,
      user_id: userId,
      before: { email: 'user@acme.com', password_hash: '$2b$10$oldhash' },
      after: { email: 'user@acme.com', password_hash: '$2b$10$newhash' },
      metadata: { accessToken: 'jwt_token_secret', apiKey: 'key_12345' },
    });

    expect(result?.before_snapshot?.password_hash).toBe('[REDACTED]');
    expect(result?.after_snapshot?.password_hash).toBe('[REDACTED]');
    expect(result?.metadata.accessToken).toBe('[REDACTED]');
    expect(result?.metadata.apiKey).toBe('[REDACTED]');
  });
});
