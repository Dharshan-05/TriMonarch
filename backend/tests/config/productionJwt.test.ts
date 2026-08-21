import { describe, it, expect } from 'vitest';
import { validateProductionConfig } from '../../src/config/production';
import { Env } from '../../src/config/env';

describe('Phase 074 — Production JWT Configuration Audit', () => {
  it('rejects short JWT secrets in production', () => {
    const shortJwtEnv: Partial<Env> = {
      NODE_ENV: 'production',
      JWT_SECRET: 'short-secret-less-than-32-chars',
    };

    expect(() => validateProductionConfig(shortJwtEnv as Env)).toThrow(/JWT_SECRET/);
  });
});
