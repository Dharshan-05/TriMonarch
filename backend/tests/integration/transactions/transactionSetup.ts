import { pool } from '../../../src/config/database';
import { verifyTestDatabaseSafety } from '../setup';

export const setupTransactionTestEnvironment = async (): Promise<void> => {
  verifyTestDatabaseSafety();
};

export const getTestPool = () => pool;
