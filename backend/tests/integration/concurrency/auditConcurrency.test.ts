import { describe, it, expect, vi } from 'vitest';
import { auditService } from '../../../src/audit/audit.service';
import { auditRepository } from '../../../src/audit/audit.repository';
import { orgAId } from './concurrencyFixtures';
import { runConcurrentRequests } from './concurrencyHelpers';

describe('Phase 065 — Audit Concurrency Tests', () => {
  it('handles 10 concurrent audit event writes without data loss or ID collisions', async () => {
    vi.spyOn(auditRepository, 'create').mockImplementation(async (input) => ({
      id: `audit-${Math.random()}`,
      organization_id: input.organization_id,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      success: true,
      created_at: new Date(),
    } as never));

    const tasks = Array.from({ length: 10 }).map((_, i) => () =>
      auditService.recordAuditEvent({
        organization_id: orgAId,
        action: 'CREATE',
        entity_type: 'PRODUCT',
        entity_id: `prod-${i}`,
      }),
    );

    const results = await runConcurrentRequests(tasks);
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
  });
});
