import { describe, it, expect, vi } from 'vitest';
import { authService } from '../../../src/services/auth.service';
import { userRepository } from '../../../src/repositories/user.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — Authentication SQL Injection Audit', () => {
  it('resists classic SQL injection attacks on login credentials', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      await expect(
        authService.login({ email: payload, password: 'password123' }),
      ).rejects.toThrow();
    }
  });
});
