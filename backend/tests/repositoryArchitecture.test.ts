import { describe, it, expect, vi } from 'vitest';
import { BaseRepository } from '../src/repositories/base/base.repository';
import { sanitizeSortColumn, sanitizeSortOrder } from '../src/repositories/base/repository.utils';
import { buildPaginationClause } from '../src/repositories/base/pagination';
import { ValidationError } from '../src/types';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { PoolClient } from 'pg';

interface TestEntity {
  id: string;
  organization_id: string;
  name: string;
  price: string;
  status: string;
  created_at: Date;
}

class TestRepository extends BaseRepository<
  TestEntity,
  { organization_id: string; name: string; price?: string; status?: string },
  { name?: string; price?: string; status?: string }
> {
  protected readonly tableName = 'test_entities';
  protected readonly allowedSortFields = ['name', 'price', 'status', 'created_at'];

  async create(
    data: { organization_id: string; name: string; price?: string; status?: string },
    client?: PoolClient,
  ): Promise<TestEntity> {
    const executor = client || pool;
    const res = await executor.query<TestEntity>(
      `INSERT INTO test_entities (organization_id, name, price, status) VALUES ($1, $2, $3, $4) RETURNING *;`,
      [data.organization_id, data.name, data.price || '0.0000', data.status || 'active'],
    );
    return res.rows[0]!;
  }

  async update(
    organizationId: string,
    id: string,
    data: { name?: string; price?: string; status?: string },
    client?: PoolClient,
  ): Promise<TestEntity | null> {
    const executor = client || pool;
    const res = await executor.query<TestEntity>(
      `UPDATE test_entities SET name = COALESCE($1, name), price = COALESCE($2, price) WHERE id = $3 AND organization_id = $4 RETURNING *;`,
      [data.name || null, data.price || null, id, organizationId],
    );
    return res.rows[0] || null;
  }
}

describe('Repository Architecture Subsystem', () => {
  const repo = new TestRepository();
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('SELECT 1 FROM test_entities WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === 'entity-1' && orgId === orgAId) {
        return { rows: [{ '?column?': 1 }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT * FROM test_entities WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === 'entity-1' && orgId === orgAId) {
        return {
          rows: [
            {
              id: 'entity-1',
              organization_id: orgAId,
              name: 'Precision Entity',
              price: '123456789.1234',
              status: 'active',
              created_at: new Date(),
            },
          ],
          rowCount: 1,
          command: '',
          oid: 0,
          fields: [],
        };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  };

  const createMockClient = () => {
    const mockClientQuery = vi.fn().mockImplementation(mockQueryFn);
    return {
      query: mockClientQuery,
      release: vi.fn(),
    } as unknown as PoolClient;
  };

  describe('Sort Injection Protection & Parameterized SQL Security', () => {
    it('should allow valid sort columns and reject malicious SQL injection attempts', () => {
      expect(sanitizeSortColumn('name', ['name', 'created_at'])).toBe('name');
      expect(sanitizeSortColumn(undefined, ['name', 'created_at'])).toBe('created_at');

      expect(() => sanitizeSortColumn('created_at; DROP TABLE users', ['name', 'created_at'])).toThrow(
        ValidationError,
      );
    });

    it('should validate sort order and reject invalid order keywords', () => {
      expect(sanitizeSortOrder('asc')).toBe('ASC');
      expect(sanitizeSortOrder('DESC')).toBe('DESC');
      expect(() => sanitizeSortOrder('INVALID')).toThrow(ValidationError);
    });
  });

  describe('Pagination & Limit Enforcement', () => {
    it('should compute limit and offset accurately and cap oversized page sizes', () => {
      const clause1 = buildPaginationClause({ params: { page: 1, pageSize: 10 }, defaultSortBy: 'name' });
      expect(clause1.limit).toBe(10);
      expect(clause1.offset).toBe(0);
      expect(clause1.sql).toContain('LIMIT 10 OFFSET 0');

      const clause2 = buildPaginationClause({ params: { page: 2, pageSize: 10 }, defaultSortBy: 'name' });
      expect(clause2.offset).toBe(10);

      const capped = buildPaginationClause({ params: { page: 1, pageSize: 500 }, defaultSortBy: 'name' });
      expect(capped.limit).toBe(100); // Capped at 100
    });
  });

  describe('Cross-Tenant Isolation at SQL Query Level', () => {
    it('should enforce organization_id filter in SQL and deny cross-tenant record retrieval', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      // Org A accesses Org A entity -> returns record
      const recordA = await repo.findById(orgAId, 'entity-1');
      expect(recordA).not.toBeNull();
      expect(recordA?.id).toBe('entity-1');

      // Org B attempts to access Org A entity -> returns null (denied at DB query level)
      const recordB = await repo.findById(orgBId, 'entity-1');
      expect(recordB).toBeNull();
    });

    it('should verify existence using efficient SELECT 1 with organization scope', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const existsOrgA = await repo.exists(orgAId, 'entity-1');
      expect(existsOrgA).toBe(true);

      const existsOrgB = await repo.exists(orgBId, 'entity-1');
      expect(existsOrgB).toBe(false);
    });
  });

  describe('Transaction Client Propagation & Decimal Preservation', () => {
    it('should propagate supplied transaction client without falling back to pool', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        await repo.findById(orgAId, 'entity-1', txClient);
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should preserve exact string representation for NUMERIC database values', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const item = await repo.findById(orgAId, 'entity-1');
      expect(item?.price).toBe('123456789.1234');
      expect(typeof item?.price).toBe('string');
    });
  });
});
