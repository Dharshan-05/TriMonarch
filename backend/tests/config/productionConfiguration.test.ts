import { describe, it, expect } from 'vitest';
import { validateProductionConfig } from '../../src/config/production';
import { Env } from '../../src/config/env';

const mockValidProductionEnv: Env = {
  PORT: 8000,
  NODE_ENV: 'production',
  LOG_LEVEL: 'info',
  DATABASE_HOST: 'postgres-prod.internal',
  DATABASE_PORT: 5432,
  DATABASE_NAME: 'trimonarch_erp_prod',
  DATABASE_USER: 'trimonarch_app',
  DATABASE_PASSWORD: 'SuperSecureProdPassword123!#$',
  DATABASE_SSL: true,
  JWT_SECRET: 'a-super-secret-production-jwt-secret-key-32-chars',
  JWT_ACCESS_SECRET: 'a-super-secret-production-access-secret-key-32-chars',
  JWT_REFRESH_SECRET: 'a-super-secret-production-refresh-secret-key-32-chars',
  JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  JWT_ISSUER: 'trimonarch-erp',
  JWT_AUDIENCE: 'trimonarch-api',
  CORS_ORIGIN: 'https://app.trimonarch.com',
  CORS_ALLOWED_HEADERS: 'Content-Type,Authorization',
  CORS_METHODS: 'GET,POST',
  CORS_CREDENTIALS: true,
  BODY_LIMIT: '1mb',
  QUERY_PARAMETER_LIMIT: 100,
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX_REQUESTS: 1000,
  GLOBAL_RATE_LIMIT: 1000,
  GLOBAL_RATE_WINDOW_MS: 900000,
  AUTH_RATE_LIMIT: 20,
  AUTH_RATE_WINDOW_MS: 900000,
  SECURITY_HSTS_ENABLED: true,
};

describe('Phase 074 — Production Configuration Audit', () => {
  it('passes validation for valid production configuration', () => {
    const result = validateProductionConfig(mockValidProductionEnv);
    expect(result.valid).toBe(true);
  });

  it('bypasses production validation when NODE_ENV is development or test', () => {
    const devEnv: Env = { ...mockValidProductionEnv, NODE_ENV: 'development', JWT_SECRET: 'short' };
    const result = validateProductionConfig(devEnv);
    expect(result.valid).toBe(true);
  });
});
