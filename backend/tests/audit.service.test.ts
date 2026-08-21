import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../src/audit/audit.service';
import { auditRepository } from '../src/audit/audit.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';

describe('Audit Service Unit Tests (Phase 039)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const userId = '33333333-3333-3333-3333-333333333333';

  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  } as unknown as PoolClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
  });

  it('should auto-derive CATEGORY_A for security and create actions if category omitted', async () => {
    const mockLog = {
      id: 'audit-svc-1',
      organization_id: orgId,
      user_id: userId,
      category: 'CATEGORY_A' as const,
      action: 'CREATE' as const,
      entity_type: 'SALES_ORDER' as const,
      entity_id: 'so-1',
      request_id: 'req-1',
      correlation_id: null,
      reason: null,
      before_snapshot: null,
      after_snapshot: null,
      success: true,
      metadata: {},
      created_at: new Date(),
    };

    vi.spyOn(auditRepository, 'create').mockResolvedValueOnce(mockLog);

    const result = await auditService.recordAuditEvent({
      organization_id: orgId,
      user_id: userId,
      action: 'CREATE',
      entity_type: 'SALES_ORDER',
      entity_id: 'so-1',
    });

    expect(result?.category).toBe('CATEGORY_A');
  });

  it('should auto-derive CATEGORY_B for UPDATE actions if category omitted', async () => {
    const mockLog = {
      id: 'audit-svc-2',
      organization_id: orgId,
      user_id: userId,
      category: 'CATEGORY_B' as const,
      action: 'UPDATE' as const,
      entity_type: 'PRODUCT' as const,
      entity_id: 'prod-1',
      request_id: 'req-2',
      correlation_id: null,
      reason: null,
      before_snapshot: null,
      after_snapshot: null,
      success: true,
      metadata: {},
      created_at: new Date(),
    };

    vi.spyOn(auditRepository, 'create').mockResolvedValueOnce(mockLog);

    const result = await auditService.recordAuditEvent({
      organization_id: orgId,
      user_id: userId,
      action: 'UPDATE',
      entity_type: 'PRODUCT',
      entity_id: 'prod-1',
    });

    expect(result?.category).toBe('CATEGORY_B');
  });

  it('should sanitize sensitive data inside before and after snapshots', async () => {
    vi.spyOn(auditRepository, 'create').mockImplementation(async (input) => {
      return {
        id: 'audit-svc-3',
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

    const result = await auditService.recordAuditEvent({
      organization_id: orgId,
      actor_id: userId,
      action: 'UPDATE',
      entity_type: 'USER',
      before: { username: 'user1', password: 'oldPassword123' },
      after: { username: 'user1', password: 'newPassword456' },
    });

    expect(result?.before_snapshot?.password).toBe('[REDACTED]');
    expect(result?.after_snapshot?.password).toBe('[REDACTED]');
  });
});
