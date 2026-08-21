import { describe, it, expect, vi } from 'vitest';
import { authService } from '../../../src/services/auth.service';
import { userRepository } from '../../../src/repositories/user.repository';

describe('Phase 068 — Account Status Security Audit', () => {
  it('rejects login for inactive or suspended users', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
      id: 'u-suspended',
      organization_id: '11111111-1111-1111-1111-111111111111',
      email: 'suspended@example.com',
      password_hash: '$2b$10$e8.Z...hash',
      status: 'suspended',
    } as never);

    await expect(
      authService.login({ email: 'suspended@example.com', password: 'Password123!' }),
    ).rejects.toThrow();
  });
});
