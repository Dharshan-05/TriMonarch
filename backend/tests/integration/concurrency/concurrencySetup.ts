import { pool } from '../../../src/config/database';
import { verifyTestDatabaseSafety } from '../setup';

export const setupConcurrencyTestEnvironment = async (): Promise<void> => {
  verifyTestDatabaseSafety();
};

export const getConcurrencyPool = () => pool;
