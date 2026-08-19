import { describe, it, expect, vi } from 'vitest';
import { withTransaction } from '../src/db/transaction';
import { pool } from '../src/config/database';
import { ValidationError } from '../src/types';

describe('Transaction Abstraction Unit Tests', () => {
  it('should execute BEGIN, callback, COMMIT and release client on success', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
    const mockRelease = vi.fn();

    vi.spyOn(pool, 'connect').mockResolvedValueOnce({
      query: mockQuery,
      release: mockRelease,
    } as unknown as Awaited<ReturnType<typeof pool.connect>>);

    const result = await withTransaction(async (client) => {
      await client.query('SELECT 1');
      return 'transaction_success';
    });

    expect(result).toBe('transaction_success');
    expect(mockQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockQuery).toHaveBeenNthCalledWith(2, 'SELECT 1');
    expect(mockQuery).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it('should execute ROLLBACK and release client on callback error', async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql === 'BEGIN') return Promise.resolve({ rows: [] });
      if (sql === 'ROLLBACK') return Promise.resolve({ rows: [] });
      if (sql === 'FAIL') return Promise.reject(new Error('Transaction SQL error'));
      return Promise.resolve({ rows: [] });
    });
    const mockRelease = vi.fn();

    vi.spyOn(pool, 'connect').mockResolvedValueOnce({
      query: mockQuery,
      release: mockRelease,
    } as unknown as Awaited<ReturnType<typeof pool.connect>>);

    await expect(
      withTransaction(async (client) => {
        await client.query('FAIL');
      }),
    ).rejects.toThrow();

    expect(mockQuery).toHaveBeenCalledWith('BEGIN');
    expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it('should construct correct isolation level and readOnly SQL', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
    const mockRelease = vi.fn();

    vi.spyOn(pool, 'connect').mockResolvedValueOnce({
      query: mockQuery,
      release: mockRelease,
    } as unknown as Awaited<ReturnType<typeof pool.connect>>);

    await withTransaction(
      async (client) => {
        await client.query('SELECT 1');
      },
      { isolationLevel: 'REPEATABLE READ', readOnly: true },
    );

    expect(mockQuery).toHaveBeenNthCalledWith(1, 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it('should reject invalid isolation level with ValidationError', async () => {
    const mockRelease = vi.fn();
    vi.spyOn(pool, 'connect').mockResolvedValueOnce({
      query: vi.fn(),
      release: mockRelease,
    } as unknown as Awaited<ReturnType<typeof pool.connect>>);

    await expect(
      withTransaction(
        async () => {},
        // @ts-expect-error Testing runtime invalid isolation level
        { isolationLevel: 'UNCOMMITTED_HAZARD' },
      ),
    ).rejects.toThrow(ValidationError);

    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it('should preserve original error when ROLLBACK itself fails', async () => {
    const originalError = new Error('Original query error');
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql === 'BEGIN') return Promise.resolve({ rows: [] });
      if (sql === 'FAIL') return Promise.reject(originalError);
      if (sql === 'ROLLBACK') return Promise.reject(new Error('Network connection dead during rollback'));
      return Promise.resolve({ rows: [] });
    });
    const mockRelease = vi.fn();

    vi.spyOn(pool, 'connect').mockResolvedValueOnce({
      query: mockQuery,
      release: mockRelease,
    } as unknown as Awaited<ReturnType<typeof pool.connect>>);

    await expect(
      withTransaction(async (client) => {
        await client.query('FAIL');
      }),
    ).rejects.toThrow('Original query error');

    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});
