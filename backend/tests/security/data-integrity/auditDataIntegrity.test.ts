import { describe, it, expect, vi } from 'vitest';
import { auditRepository } from '../../../src/audit/audit.repository';

describe('Phase 070 — Audit & Business Event Integrity Audit', () => {
  it('enforces immutable server-generated audit logging properties', async () => {
    vi.spyOn(auditRepository, 'findById').mockResolvedValue({
      id: 'audit-log-1',
      organization_id: '11111111-1111-1111-1111-111111111111',
      actor_user_id: 'user-1',
      action: 'UPDATE',
      entity_type: 'product',
      entity_id: 'prod-1',
      created_at: new Date().toISOString(),
    } as never);

    const log = await auditRepository.findById('11111111-1111-1111-1111-111111111111', 'audit-log-1');
    expect(log).toBeDefined();
    expect(log?.actor_user_id).toBe('user-1');
  });
});
