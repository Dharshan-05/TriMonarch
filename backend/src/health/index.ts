import { Router, Request, Response, NextFunction } from 'express';
import { testDatabaseConnection, pool } from '../config/database';
import { checkDatabaseHealth } from './databaseHealth';
import { HealthCheckResponse } from '../types';

const router = Router();

export interface HealthStatusResponse {
  status: 'ok' | 'ready' | 'not_ready' | 'degraded';
  timestamp: string;
  service: string;
  uptimeSeconds?: number;
  checks?: Record<string, string>;
}

// 1. Existing Canonical Health Check (Docker & Backward Compatibility)
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

// 2. Process Liveness Health Check (No DB dependency)
router.get('/health/live', (_req: Request, res: Response) => {
  const response: HealthStatusResponse = {
    status: 'ok',
    service: 'trimonarch-erp-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };

  res.status(200).json(response);
});

// 3. Dependency Readiness Health Check (DB dependency)
router.get('/health/ready', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();

  if (dbHealth.healthy) {
    const response: HealthStatusResponse = {
      status: 'ready',
      service: 'trimonarch-erp-backend',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
      },
    };
    res.status(200).json(response);
  } else {
    const response: HealthStatusResponse = {
      status: 'not_ready',
      service: 'trimonarch-erp-backend',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'unavailable',
      },
    };
    res.status(503).json(response);
  }
});

// Backward compatibility alias for /ready
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
