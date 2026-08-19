import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { handleDatabaseError } from './errors';

export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback failure if connection was severed
    }
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
};
