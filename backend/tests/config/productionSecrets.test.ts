import { describe, it, expect } from 'vitest';
import { validateProductionConfig } from '../../src/config/production';
import { Env } from '../../src/config/env';

describe('Phase 074 — Production Secret Protection Audit', () => {
  it('rejects known development secrets and placeholder passwords in production', () => {
    const devSecretsEnv: Partial<Env> = {
      NODE_ENV: 'production',
      JWT_SECRET: 'development-super-secret-key-32-chars-long',
      DATABASE_PASSWORD: 'CHANGE_ME',
    };

    expect(() => validateProductionConfig(devSecretsEnv as Env)).toThrow(/JWT_SECRET|DATABASE_PASSWORD/);
  });
});
