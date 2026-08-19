import { describe, it, expect, vi } from 'vitest';
import { userRepository } from '../src/repositories/user.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { handleDatabaseError, DuplicateKeyError } from '../src/db/errors';
import { PoolClient } from 'pg';

describe('UserRepository Subsystem (Phase 010)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = 'user-a-1111';

  const mockUserA = {
    id: userAId,
    organization_id: orgAId,
    name: 'Alice User',
    email: 'alice@acme.com',
    phone: '+15550100',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUserWithAuth = {
    ...mockUserA,
    password_hash: '$2b$10$hashedpasswordstring',
    password_changed_at: new Date(),
    last_login_at: new Date(),
  };

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO users')) {
      const email = params?.[2] as string;
      if (email === 'duplicate@acme.com') {
        throw handleDatabaseError({
          code: '23505',
          detail: 'Key (organization_id, email)=(11111111-1111-1111-1111-111111111111, duplicate@acme.com) already exists.',
          constraint: 'uq_users_org_email',
        });
      }
      return { rows: [mockUserA], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === userAId && orgId === orgAId) {
        return { rows: [mockUserA], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('WHERE email = $1 AND organization_id = $2')) {
      const [email, orgId] = params as [string, string];
      if (email === 'alice@acme.com' && orgId === orgAId) {
        return { rows: [mockUserA], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('password_hash') && sql.includes('WHERE email = $1')) {
      const [email] = params as [string];
      if (email === 'alice@acme.com') {
        return { rows: [mockUserWithAuth], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM users') && sql.includes('WHERE email = $1')) {
      const [email] = params as [string];
      if (email === 'alice@acme.com') {
        return { rows: [mockUserA], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT COUNT(*) as count FROM users')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT * FROM users') || sql.includes('SELECT id, organization_id')) {
      return { rows: [mockUserA], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE users SET last_login_at')) {
      return { rows: [], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE users SET password_hash')) {
      return { rows: [], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE users SET')) {
      return { rows: [mockUserA], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM users')) {
      const [id, orgId] = params as [string, string];
      if (id === userAId && orgId === orgAId) {
        return { rows: [{ id: userAId }], rowCount: 1, command: '', oid: 0, fields: [] };
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

  describe('User CRUD Operations', () => {
    it('should create a new user record cleanly', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const created = await userRepository.create({
        organization_id: orgAId,
        name: 'Alice User',
        email: 'alice@acme.com',
      });

      expect(created.id).toBe(userAId);
      expect(created.email).toBe('alice@acme.com');
      expect(created.organization_id).toBe(orgAId);
    });

    it('should find user by ID with organization scope', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const user = await userRepository.findById(orgAId, userAId);
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Alice User');
    });

    it('should find user by email with organization scope and global fallback', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const userScoped = await userRepository.findByEmail(orgAId, 'alice@acme.com');
      expect(userScoped).not.toBeNull();
      expect(userScoped?.email).toBe('alice@acme.com');

      const userGlobal = await userRepository.findByEmail('alice@acme.com');
      expect(userGlobal).not.toBeNull();
      expect(userGlobal?.email).toBe('alice@acme.com');
    });

    it('should update user attributes safely', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await userRepository.update(orgAId, userAId, { name: 'Alice Updated' });
      expect(updated).not.toBeNull();
    });

    it('should delete user returning deletion status boolean', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await userRepository.delete(orgAId, userAId);
      expect(deleted).toBe(true);

      const deleteDenied = await userRepository.delete(orgBId, userAId);
      expect(deleteDenied).toBe(false);
    });
  });

  describe('Multi-Tenant Organization Isolation Test', () => {
    it('should deny cross-tenant user access when querying with different organization_id', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const crossTenantUser = await userRepository.findById(orgBId, userAId);
      expect(crossTenantUser).toBeNull();
    });
  });

  describe('Authentication Compatibility & Password Security', () => {
    it('should retrieve authentication credentials via findByEmailForAuthentication', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const authUser = await userRepository.findByEmailForAuthentication('alice@acme.com');
      expect(authUser).not.toBeNull();
      expect(authUser?.password_hash).toBe('$2b$10$hashedpasswordstring');
    });

    it('should update last_login_at timestamp', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await userRepository.updateLastLogin(userAId, mockClient);
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1;',
        [userAId],
      );
    });

    it('should update password_hash and password_changed_at timestamp', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await userRepository.updatePasswordHash(userAId, '$2b$10$newhash', mockClient);
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP WHERE id = $2;',
        ['$2b$10$newhash', userAId],
      );
    });
  });

  describe('Database Constraint Violations', () => {
    it('should map duplicate email violation to DuplicateKeyError (23505)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        userRepository.create({
          organization_id: orgAId,
          name: 'Duplicate User',
          email: 'duplicate@acme.com',
        }),
      ).rejects.toThrow(DuplicateKeyError);
    });
  });

  describe('Transaction Client Propagation', () => {
    it('should execute all queries through supplied PoolClient when inside transaction', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        await userRepository.findById(orgAId, userAId, txClient);
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('Pagination, Search, & Filtering', () => {
    it('should list users with pagination metadata', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const result = await userRepository.listByOrganization(orgAId, {
        page: 1,
        pageSize: 10,
        query: 'Alice',
        status: 'active',
      });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });
  });
});
