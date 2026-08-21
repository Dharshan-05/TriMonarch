import { describe, it, expect, vi } from 'vitest';
import { passwordService } from '../src/services/password.service';
import { userRepository } from '../src/repositories/user.repository';
import { businessEventService } from '../src/services/businessEvent.service';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { DatabaseError } from '../src/db/errors';
import { PoolClient } from 'pg';

describe('Password Transaction Atomicity Tests (Phase 042)', () => {
  const userId = '33333333-3333-3333-3333-333333333333';
  const orgId = '11111111-1111-1111-1111-111111111111';
  const currentPassword = 'OldPassword123!';
  const newPassword = 'NewPassword123!';

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

  it('Password update error inside transaction MUST cause ROLLBACK', async () => {
    const mockClient = createMockClient();
    vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

    const oldHash = await passwordService.hashPassword(currentPassword);
    const mockUser = {
      id: userId,
      organization_id: orgId,
      name: 'Test',
      email: 'test@acme.com',
      phone: null,
      status: 'active' as const,
      password_hash: oldHash,
      password_changed_at: new Date(),
      last_login_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(mockUser);
    vi.spyOn(userRepository, 'findByEmailForAuthentication').mockResolvedValueOnce(mockUser);
    vi.spyOn(userRepository, 'updatePasswordHash').mockRejectedValueOnce(
      new DatabaseError('Password update constraint error'),
    );

    await expect(
      withTransaction(async (txClient) => {
        await passwordService.changePassword(userId, orgId, currentPassword, newPassword, txClient);
      }),
    ).rejects.toThrow();

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('Successful password update transaction commits atomically', async () => {
    const mockClient = createMockClient();
    vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

    const oldHash = await passwordService.hashPassword(currentPassword);
    const mockUser = {
      id: userId,
      organization_id: orgId,
      name: 'Test',
      email: 'test@acme.com',
      phone: null,
      status: 'active' as const,
      password_hash: oldHash,
      password_changed_at: new Date(),
      last_login_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(mockUser);
    vi.spyOn(userRepository, 'findByEmailForAuthentication').mockResolvedValueOnce(mockUser);
    vi.spyOn(userRepository, 'updatePasswordHash').mockResolvedValueOnce();
    vi.spyOn(businessEventService, 'emit').mockResolvedValueOnce(null);

    await withTransaction(async (txClient) => {
      await passwordService.changePassword(userId, orgId, currentPassword, newPassword, txClient);
    });

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });
});
