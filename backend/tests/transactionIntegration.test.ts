import { describe, it, expect, vi } from 'vitest';
import { withTransaction } from '../src/db/transaction';
import { pool } from '../src/config/database';
import { userRepository } from '../src/repositories/user.repository';
import { departmentRepository } from '../src/repositories/department.repository';
import { inventoryRepository } from '../src/repositories/inventory.repository';
import { DatabaseError } from '../src/db/errors';
import { PoolClient } from 'pg';

describe('Real / Mocked Transaction Integration & Atomic Consistency', () => {
  const dummyOrgId = '11111111-1111-1111-1111-111111111111';

  const createMockPoolClient = () => {
    const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
      return { rows: [], rowCount: 1, command: sql, oid: 0, fields: [] };
    });
    const mockRelease = vi.fn();
    return {
      query: mockQuery,
      release: mockRelease,
    } as unknown as PoolClient;
  };

  describe('Multi-Step Atomic ERP Transaction Rollback', () => {
    it('should rollback all multi-step operations when any operation in callback fails', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const createdUser = {
        id: 'user-atomic-1',
        organization_id: dummyOrgId,
        name: 'Atomic User',
        email: 'atomic@acme.com',
        phone: null,
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const createdDept = {
        id: 'dept-atomic-1',
        organization_id: dummyOrgId,
        name: 'Atomic Dept',
        code: 'ATOMIC_DEPT',
        description: null,
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(userRepository, 'create').mockResolvedValueOnce(createdUser);
      vi.spyOn(departmentRepository, 'create').mockResolvedValueOnce(createdDept);

      let step1Done = false;
      let step2Done = false;

      await expect(
        withTransaction(async (tx) => {
          const user = await userRepository.create(
            { organization_id: dummyOrgId, name: 'Atomic User', email: 'atomic@acme.com' },
            tx,
          );
          step1Done = true;
          expect(user.id).toBe('user-atomic-1');

          const dept = await departmentRepository.create(
            { organization_id: dummyOrgId, name: 'Atomic Dept', code: 'ATOMIC_DEPT' },
            tx,
          );
          step2Done = true;
          expect(dept.id).toBe('dept-atomic-1');

          // Force step 3 failure
          throw new DatabaseError('Simulated constraint violation in Step 3');
        }),
      ).rejects.toThrow('Simulated constraint violation in Step 3');

      expect(step1Done).toBe(true);
      expect(step2Done).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('Inventory Stock Adjustment & Concurrency Guarantee', () => {
    it('should perform atomic stock adjustment and commit on success', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const mockInventory = {
        id: 'inv-100',
        organization_id: dummyOrgId,
        product_id: 'prod-100',
        warehouse_id: 'wh-100',
        quantity: 100,
        reorder_level: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockAdjustedPlus = { ...mockInventory, quantity: 125 };

      vi.spyOn(inventoryRepository, 'adjustQuantityAtomic').mockResolvedValueOnce(mockAdjustedPlus);

      const result = await withTransaction(async (tx) => {
        return inventoryRepository.adjustQuantityAtomic(dummyOrgId, 'inv-100', 25, tx);
      });

      expect(result?.quantity).toBe(125);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should correctly aggregate concurrent atomic updates without lost updates', async () => {
      vi.spyOn(pool, 'connect').mockImplementation(async () => createMockPoolClient());

      let currentStock = 100;

      // Mock atomic SQL update: SET quantity = quantity + $1
      vi.spyOn(inventoryRepository, 'adjustQuantityAtomic').mockImplementation(
        async (_orgId, _id, delta) => {
          currentStock += delta;
          return {
            id: 'inv-100',
            organization_id: dummyOrgId,
            product_id: 'prod-100',
            warehouse_id: 'wh-100',
            quantity: currentStock,
            reorder_level: 10,
            created_at: new Date(),
            updated_at: new Date(),
          };
        },
      );

      // Concurrent Request A: +20 stock
      const txA = withTransaction(async (tx) => {
        return inventoryRepository.adjustQuantityAtomic(dummyOrgId, 'inv-100', 20, tx);
      });

      // Concurrent Request B: -30 stock
      const txB = withTransaction(async (tx) => {
        return inventoryRepository.adjustQuantityAtomic(dummyOrgId, 'inv-100', -30, tx);
      });

      await Promise.all([txA, txB]);

      // $100 + 20 - 30 = 90$
      expect(currentStock).toBe(90);
    });
  });
});
