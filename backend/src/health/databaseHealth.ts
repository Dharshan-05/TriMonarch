import { pool } from '../config/database';

export interface DatabaseHealthResult {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}

export const checkDatabaseHealth = async (timeoutMs: number = 3000): Promise<DatabaseHealthResult> => {
  const startTime = Date.now();

  try {
    const clientPromise = pool.connect();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database health check timed out')), timeoutMs);
    });

    const client = await Promise.race([clientPromise, timeoutPromise]);

    try {
      await client.query('SELECT 1;');
      const latencyMs = Date.now() - startTime;
      return { healthy: true, latencyMs };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : 'Database check failed';
    const isTimeout = rawMessage.includes('timed out');
    const sanitizedError = isTimeout ? 'Database connection timed out' : 'Database connection unavailable';
    return { healthy: false, error: sanitizedError };
  }
};
