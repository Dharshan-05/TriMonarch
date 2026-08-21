import { describe, it, expect } from 'vitest';
import { validateProductionConfig } from '../../src/config/production';
import { Env } from '../../src/config/env';

describe('Phase 074 — Production Database Configuration Audit', () => {
  it('rejects localhost database host in production without explicit permission option', () => {
    const localhostDbEnv: Partial<Env> = {
      NODE_ENV: 'production',
      DATABASE_HOST: 'localhost',
      DATABASE_PASSWORD: 'ValidSecureProdPassword123!',
      JWT_SECRET: 'a-super-secret-production-jwt-secret-key-32-chars',
      JWT_ACCESS_SECRET: 'a-super-secret-production-access-secret-key-32-chars',
      JWT_REFRESH_SECRET: 'a-super-secret-production-refresh-secret-key-32-chars',
    };

    expect(() => validateProductionConfig(localhostDbEnv as Env)).toThrow(/DATABASE_HOST/);
  });
});
