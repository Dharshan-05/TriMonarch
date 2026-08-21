import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditRepository } from '../src/audit/audit.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';

describe('Audit Log Repository Phase 039 Extensions', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const userId = '33333333-3333-3333-3333-333333333333';
  const entityId = '44444444-4444-4444-4444-444444444444';

  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  } as unknown as PoolClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
  });

  it('should insert audit log record with category, correlation_id, snapshots, and reason', async () => {
    const mockRecord = {
      id: 'audit-039-1',
      organization_id: orgId,
      user_id: userId,
      category: 'CATEGORY_A',
      action: 'UPDATE',
      entity_type: 'MANUFACTURING_ORDER',
      entity_id: entityId,
      request_id: 'req-039-1',
      correlation_id: 'corr-039-1',
      reason: 'State transition to in_progress',
      before_snapshot: { status: 'released' },
      after_snapshot: { status: 'in_progress' },
      success: true,
      metadata: { event: 'MANUFACTURING_ORDER_STARTED' },
      created_at: new Date(),
    };

    vi.spyOn(mockClient, 'query').mockResolvedValue({
      rows: [mockRecord],
      rowCount: 1,
    } as never);

    const res = await auditRepository.create(
      {
        organization_id: orgId,
        user_id: userId,
        category: 'CATEGORY_A',
        action: 'UPDATE',
        entity_type: 'MANUFACTURING_ORDER',
        entity_id: entityId,
        request_id: 'req-039-1',
        correlation_id: 'corr-039-1',
        reason: 'State transition to in_progress',
        before_snapshot: { status: 'released' },
        after_snapshot: { status: 'in_progress' },
        metadata: { event: 'MANUFACTURING_ORDER_STARTED' },
      },
      mockClient,
    );

    expect(res.id).toBe('audit-039-1');
    expect(res.category).toBe('CATEGORY_A');
    expect(res.correlation_id).toBe('corr-039-1');
  });

  it('should filter by actor_id correctly', async () => {
    const mockPaginated = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };

    vi.spyOn(auditRepository, 'listByOrganization').mockResolvedValueOnce(mockPaginated as never);

    const res = await auditRepository.listByActor(orgId, userId);
    expect(res.items).toEqual([]);
    expect(auditRepository.listByOrganization).toHaveBeenCalledWith(orgId, { actor_id: userId }, undefined);
  });
});
