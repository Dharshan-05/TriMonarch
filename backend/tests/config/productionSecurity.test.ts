import { describe, it, expect } from 'vitest';
import { validateProductionConfig } from '../../src/config/production';
import { Env } from '../../src/config/env';

describe('Phase 074 — Production Security Policy Audit', () => {
  it('enforces secure production environment requirements', () => {
    const invalidEnv: Partial<Env> = {
      NODE_ENV: 'production',
      JWT_SECRET: 'development-super-secret-key-32-chars-long',
    };

    expect(() => validateProductionConfig(invalidEnv as Env)).toThrow();
  });
});
