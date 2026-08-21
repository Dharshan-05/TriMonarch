import { describe, it, expect, vi } from 'vitest';
import { structuredLogger } from '../../src/observability/logger';

describe('Phase 075 — Structured Logger Audit', () => {
  it('redacts sensitive fields like passwords and tokens in log metadata', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    structuredLogger.info('User login attempted', {
      username: 'user1',
      password: 'super-secret-password',
      token: 'jwt-bearer-token',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logArg = consoleSpy.mock.calls[0][0];
    expect(logArg).toContain('[REDACTED]');
    expect(logArg).not.toContain('super-secret-password');
  });
});
