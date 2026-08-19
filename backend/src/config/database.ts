import { Pool, types } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

// Enforce PostgreSQL NUMERIC / DECIMAL (OID 1700) to return exact string representation
types.setTypeParser(1700, (val: string) => val);

export const pool = new Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  database: env.DATABASE_NAME,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle database client');
});

export interface DbStatus {
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

export const testDatabaseConnection = async (): Promise<DbStatus> => {
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      const latencyMs = Date.now() - start;
      return { connected: true, latencyMs };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.warn({ error: errorMessage }, 'Database connectivity check failed');
    return { connected: false, error: errorMessage };
  }
};

export const closeDatabasePool = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (err) {
    logger.error({ err }, 'Error closing database pool');
  }
};
