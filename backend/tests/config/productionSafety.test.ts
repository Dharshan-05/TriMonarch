import { describe, it, expect } from 'vitest';
import { validateProductionConfig } from '../../src/config/production';
import { Env } from '../../src/config/env';

describe('Phase 074 — Production Safety Guard Audit', () => {
  it('detects multiple production safety violations simultaneously and reports errors', () => {
    const dangerousEnv: Partial<Env> = {
      NODE_ENV: 'production',
      JWT_SECRET: 'development-super-secret-key-32-chars-long',
      DATABASE_HOST: 'localhost',
      DATABASE_PASSWORD: 'postgres',
      CORS_ORIGIN: '*',
      CORS_CREDENTIALS: true,
      GLOBAL_RATE_LIMIT: -1,
    };

    expect(() => validateProductionConfig(dangerousEnv as Env)).toThrow(/Production configuration validation failed/);
  });
});
