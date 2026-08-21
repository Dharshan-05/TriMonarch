import { pool } from '../../src/config/database';
import { logger } from '../../src/utils/logger';

export const isTestEnvironment = (): boolean => {
  const envName = process.env.NODE_ENV || 'test';
  return envName === 'test' || envName === 'development';
};

export const verifyTestDatabaseSafety = (): void => {
  const dbName = process.env.TEST_DATABASE_NAME || process.env.DATABASE_NAME || 'erp_db';
  if (dbName.includes('prod') || dbName.includes('production')) {
    throw new Error(`CRITICAL SECURITY FAILURE: Integration tests must never target production database '${dbName}'!`);
  }
};

export const initIntegrationTestEnvironment = async (): Promise<boolean> => {
  verifyTestDatabaseSafety();
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error) {
    logger.warn({ error }, 'PostgreSQL database not available for integration tests. Falling back to in-memory transaction simulation.');
    return false;
  }
};
