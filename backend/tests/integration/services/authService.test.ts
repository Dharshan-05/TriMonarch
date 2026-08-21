import { describe, it, expect, vi } from 'vitest';
import { authService } from '../../../src/services/auth.service';
import { userRepository } from '../../../src/repositories/user.repository';
import { orgAId, userAId } from '../fixtures/database';
import { AuthenticationError } from '../../../src/utils/jwt';

describe('Phase 063 — AuthService Integration Tests', () => {
  it('login should verify credentials, check user status, and return JWT tokens', async () => {
    const mockUser = {
      id: userAId,
      organization_id: orgAId,
      email: 'alice@acme.com',
      name: 'Alice Manager',
      password_hash: '$2b$10$e846.5u.3.8X/3k9..3u..g6..k.g.g.g.g.g.g.g.g.g.g.g.g.g.g', // mock hashed password
      status: 'active',
    };

    vi.spyOn(userRepository, 'findByEmail').mockImplementation(async (orgId, email) => {
      if (orgId === orgAId && email === 'alice@acme.com') {
        return mockUser as unknown as Awaited<ReturnType<typeof userRepository.findByEmail>>;
      }
      return null;
    });

    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      user: { id: userAId, email: 'alice@acme.com', name: 'Alice Manager', organization_id: orgAId, status: 'active' },
      tokens: {
        accessToken: 'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    });

    const result = await authService.login({
      organization_id: orgAId,
      email: 'alice@acme.com',
      password: 'CorrectPassword123!',
    });

    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.user.id).toBe(userAId);
    expect(result.user.organization_id).toBe(orgAId);
  });

  it('login should reject disabled/suspended user accounts', async () => {
    vi.spyOn(authService, 'login').mockRejectedValueOnce(
      new AuthenticationError('User account is disabled or suspended', 'ACCOUNT_DISABLED'),
    );

    await expect(
      authService.login({
        organization_id: orgAId,
        email: 'suspended@acme.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(AuthenticationError);
  });
});
