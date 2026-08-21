import { describe, it, expect } from 'vitest';
import { validateProductionConfig } from '../../src/config/production';
import { Env } from '../../src/config/env';

describe('Phase 074 — Production Rate Limiting Configuration Audit', () => {
  it('rejects non-positive rate limits in production', () => {
    const invalidRateEnv: Partial<Env> = {
      NODE_ENV: 'production',
      GLOBAL_RATE_LIMIT: 0,
    };

    expect(() => validateProductionConfig(invalidRateEnv as Env)).toThrow(/GLOBAL_RATE_LIMIT/);
  });
});
