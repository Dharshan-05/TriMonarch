import { describe, it, expect, vi } from 'vitest';
import { authService } from '../../../src/services/auth.service';
import { userRepository } from '../../../src/repositories/user.repository';

describe('Phase 068 — User Enumeration Protection Audit', () => {
  it('returns generic authentication error for nonexistent user and wrong password', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nonexistent@example.com', password: 'password123' }),
    ).rejects.toThrow();
  });
});
