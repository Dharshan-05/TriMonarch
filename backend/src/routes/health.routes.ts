import { Router, Request, Response, NextFunction } from 'express';
import { testDatabaseConnection } from '../config/database';
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

export default router;
