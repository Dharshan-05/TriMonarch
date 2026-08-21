import { Router, Request, Response, NextFunction } from 'express';
import { testDatabaseConnection, pool } from '../config/database';
import { HealthCheckResponse } from '../types';

const router = Router();

router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbStatus = await testDatabaseConnection();
    const isHealthy = dbStatus.connected;

    const response: HealthCheckResponse = {
      success: true,
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'erp-backend',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus.connected ? 'connected' : 'disconnected',
        ...(dbStatus.latencyMs !== undefined && { latencyMs: dbStatus.latencyMs }),
        ...(dbStatus.error !== undefined && { error: dbStatus.error }),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1;');
      res.status(200).json({
        success: true,
        status: 'ready',
        service: 'erp-backend',
        timestamp: new Date().toISOString(),
      });
    } finally {
      client.release();
    }
  } catch {
    res.status(503).json({
      success: false,
      status: 'not_ready',
      service: 'erp-backend',
      timestamp: new Date().toISOString(),
      error: 'Database connection check failed',
    });
  }
});

export default router;
