import { describe, it, expect, vi } from 'vitest';
import { businessEventService } from '../src/services/businessEvent.service';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { DatabaseError } from '../src/db/errors';
import { PoolClient } from 'pg';

describe('Business Event Transaction Atomicity Tests (Phase 040)', () => {
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

  it('Business event error inside transaction MUST cause ROLLBACK', async () => {
    const mockClient = createMockClient();
    vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

    vi.spyOn(auditService, 'recordAuditEvent').mockRejectedValueOnce(
      new DatabaseError('Audit persistence failure'),
    );

    await expect(
      withTransaction(async (txClient) => {
        await businessEventService.emit(
          {
            eventName: 'PURCHASE_RECEIPT_POSTED',
            organization_id: orgId,
            user_id: userId,
            entity_id: '66666666-6666-6666-6666-666666666666',
          },
          txClient,
        );
      }),
    ).rejects.toThrow();

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('Successful transaction commits both business logic and business event audit entry', async () => {
    const mockClient = createMockClient();
    vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
      id: 'audit-be-tx-1',
      organization_id: orgId,
      user_id: userId,
      category: 'CATEGORY_A',
      action: 'UPDATE',
      entity_type: 'PURCHASE_RECEIPT',
      entity_id: '66666666-6666-6666-6666-666666666666',
      request_id: 'req-1',
      correlation_id: null,
      reason: null,
      before_snapshot: null,
      after_snapshot: null,
      success: true,
      metadata: {},
      created_at: new Date(),
    });

    await withTransaction(async (txClient) => {
      await businessEventService.emit(
        {
          eventName: 'PURCHASE_RECEIPT_POSTED',
          organization_id: orgId,
          user_id: userId,
          entity_id: '66666666-6666-6666-6666-666666666666',
        },
        txClient,
      );
    });

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });
});
