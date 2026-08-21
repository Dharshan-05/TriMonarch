import { pool } from '../../../src/config/database';

export const waitForLock = async (tableName: string, timeoutMs = 1000): Promise<boolean> => {
  try {
    const client = await pool.connect();
    try {
      await client.query(`SET LOCAL statement_timeout = ${timeoutMs};`);
      await client.query(`SELECT * FROM ${tableName} LIMIT 1 FOR UPDATE;`);
      return true;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
};
