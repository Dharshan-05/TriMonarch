import { processEnv } from '../../src/config/env';

export const verifyE2ETestEnvironment = (): void => {
  if (processEnv.NODE_ENV === 'production') {
    throw new Error('E2E tests cannot be run in production environment!');
  }
  const dbName = processEnv.DB_NAME || '';
  if (dbName.includes('prod') || dbName.includes('production')) {
    throw new Error('E2E tests cannot target a production database name!');
  }
};

verifyE2ETestEnvironment();
