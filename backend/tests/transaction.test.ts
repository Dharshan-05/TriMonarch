import { describe, it, expect, vi } from 'vitest';
import { withTransaction } from '../src/db/transaction';
import { pool } from '../src/config/database';

describe('Transaction Abstraction', () => {
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

  it('should execute ROLLBACK and release client on error', async () => {
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
});
