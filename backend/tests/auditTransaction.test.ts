import { describe, it, expect, vi } from 'vitest';
import { auditService } from '../src/audit/audit.service';
import { auditRepository } from '../src/audit/audit.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { DatabaseError } from '../src/db/errors';
import { PoolClient } from 'pg';

describe('Audit Transaction Atomicity Tests (Phase 039)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const userId = '33333333-3333-3333-3333-333333333333';

  const createMockClient = () => {
    const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
      return { rows: [], rowCount: 1, command: sql, oid: 0, fields: [] };
    });
    const mockRelease = vi.fn();
    return {
      query: mockQuery,
      release: mockRelease,
    } as unknown as PoolClient;
  };

  it('Category A audit error inside transaction MUST trigger ROLLBACK', async () => {
    const mockClient = createMockClient();
    vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

    vi.spyOn(auditRepository, 'create').mockRejectedValueOnce(
      new DatabaseError('Audit constraint exception'),
    );

    await expect(
      withTransaction(async (txClient) => {
        await auditService.recordAuditEvent(
          {
            organization_id: orgId,
            user_id: userId,
            category: 'CATEGORY_A',
            action: 'CREATE',
            entity_type: 'SALES_ORDER',
          },
          txClient,
        );
      }),
    ).rejects.toThrow();

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('Successful transaction commits both business and audit data', async () => {
    const mockClient = createMockClient();
    vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

    vi.spyOn(auditRepository, 'create').mockResolvedValueOnce({
      id: 'audit-tx-1',
      organization_id: orgId,
      user_id: userId,
      category: 'CATEGORY_A',
      action: 'CREATE',
      entity_type: 'SALES_ORDER',
      entity_id: 'so-1',
      request_id: 'req-tx',
      correlation_id: null,
      reason: null,
      before_snapshot: null,
      after_snapshot: null,
      success: true,
      metadata: {},
      created_at: new Date(),
    });

    await withTransaction(async (txClient) => {
      await auditService.recordAuditEvent(
        {
          organization_id: orgId,
          user_id: userId,
          category: 'CATEGORY_A',
          action: 'CREATE',
          entity_type: 'SALES_ORDER',
          entity_id: 'so-1',
        },
        txClient,
      );
    });

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });
});
