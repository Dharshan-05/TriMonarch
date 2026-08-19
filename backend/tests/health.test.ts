import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import * as dbModule from '../src/config/database';

describe('GET /health', () => {
  it('should return 200 and healthy status when database is connected', async () => {
    vi.spyOn(dbModule, 'testDatabaseConnection').mockResolvedValueOnce({
      connected: true,
      latencyMs: 5,
    });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      status: 'healthy',
      service: 'erp-backend',
      database: {
        status: 'connected',
        latencyMs: 5,
      },
    });
    expect(response.body.timestamp).toBeDefined();
  });

  it('should return 200 and degraded status when database is disconnected', async () => {
    vi.spyOn(dbModule, 'testDatabaseConnection').mockResolvedValueOnce({
      connected: false,
      error: 'Connection refused',
    });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      status: 'degraded',
      service: 'erp-backend',
      database: {
        status: 'disconnected',
        error: 'Connection refused',
      },
    });
  });
});
