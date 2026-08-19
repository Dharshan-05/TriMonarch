import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { handleDatabaseError } from './errors';
import { logger } from '../utils/logger';
import { ValidationError } from '../types';

export type TransactionIsolationLevel = 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

export interface TransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  readOnly?: boolean;
  statementTimeoutMs?: number;
}

const ALLOWED_ISOLATION_LEVELS = new Set<TransactionIsolationLevel>([
  'READ COMMITTED',
  'REPEATABLE READ',
  'SERIALIZABLE',
]);

export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> => {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    let beginSql = 'BEGIN';

    if (options?.isolationLevel) {
      if (!ALLOWED_ISOLATION_LEVELS.has(options.isolationLevel)) {
        throw new ValidationError(`Invalid transaction isolation level: ${options.isolationLevel}`);
      }
      beginSql += ` ISOLATION LEVEL ${options.isolationLevel}`;
    }

    if (options?.readOnly) {
      beginSql += ' READ ONLY';
    }

    await client.query(beginSql);

    if (options?.statementTimeoutMs !== undefined) {
      if (typeof options.statementTimeoutMs !== 'number' || options.statementTimeoutMs < 0) {
        throw new ValidationError('statementTimeoutMs must be a non-negative number');
      }
      await client.query(`SET LOCAL statement_timeout = ${Math.floor(options.statementTimeoutMs)};`);
    }

    const result = await callback(client);

    await client.query('COMMIT');

    const duration = Date.now() - startTime;
    logger.debug({ duration, isolationLevel: options?.isolationLevel || 'READ COMMITTED' }, 'Transaction committed successfully');

    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      logger.error({ rollbackError, originalError: error }, 'Failed to execute ROLLBACK for transaction');
    }

    const duration = Date.now() - startTime;
    logger.warn({ duration, error }, 'Transaction rolled back due to error');

    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
};
