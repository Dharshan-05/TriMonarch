import { pool } from '../../../src/config/database';
import { PoolClient } from 'pg';

export const runInTestTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('ROLLBACK');
    return result;
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};
