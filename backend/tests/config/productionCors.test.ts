import { describe, it, expect } from 'vitest';
import { validateProductionConfig } from '../../src/config/production';
import { Env } from '../../src/config/env';

describe('Phase 074 — Production CORS Hardening Audit', () => {
  it('rejects wildcard CORS_ORIGIN "*" with CORS_CREDENTIALS in production', () => {
    const wildcardCorsEnv: Partial<Env> = {
      NODE_ENV: 'production',
      CORS_ORIGIN: '*',
      CORS_CREDENTIALS: true,
      DATABASE_HOST: 'postgres-prod.internal',
      DATABASE_PASSWORD: 'ValidSecureProdPassword123!',
      JWT_SECRET: 'a-super-secret-production-jwt-secret-key-32-chars',
      JWT_ACCESS_SECRET: 'a-super-secret-production-access-secret-key-32-chars',
      JWT_REFRESH_SECRET: 'a-super-secret-production-refresh-secret-key-32-chars',
    };

    expect(() => validateProductionConfig(wildcardCorsEnv as Env)).toThrow(/CORS_ORIGIN/);
  });
});
