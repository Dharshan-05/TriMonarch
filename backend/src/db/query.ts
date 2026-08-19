import { PoolClient, QueryResultRow } from 'pg';
import { pool } from '../config/database';
import { handleDatabaseError } from './errors';

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
  client?: PoolClient,
): Promise<T[]> => {
  try {
    const executor = client || pool;
    const result = await executor.query<T>(text, params);
    return result.rows;
  } catch (error) {
    throw handleDatabaseError(error);
  }
};

export const queryOne = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
  client?: PoolClient,
): Promise<T | null> => {
  const rows = await query<T>(text, params, client);
  return rows[0] || null;
};
