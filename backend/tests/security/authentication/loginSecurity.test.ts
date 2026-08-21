import { describe, it, expect, vi } from 'vitest';
import { authService } from '../../../src/services/auth.service';
import { userRepository } from '../../../src/repositories/user.repository';

describe('Phase 068 — Login Security Audit', () => {
  it('rejects login attempts with invalid password', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
      id: 'u-1',
      organization_id: '11111111-1111-1111-1111-111111111111',
      email: 'test@example.com',
      password_hash: '$2b$10$e8.Z...invalid',
      status: 'active',
    } as never);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrongpassword' }),
    ).rejects.toThrow();
  });
});
