import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/features/auth/services/auth.service';
import { apiClient } from '@/lib/api/client';

describe('AuthService API Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('invokes login endpoint and parses LoginResult', async () => {
    const mockLoginResult = {
      accessToken: 'acc-token-123',
      refreshToken: 'ref-token-456',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: 'usr-1',
        email: 'user@trimonarch.com',
        organization_id: 'org-1',
        status: 'active' as const,
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockLoginResult);

    const result = await authService.login({ email: 'user@trimonarch.com', password: 'password123' });
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@trimonarch.com',
      password: 'password123',
    });
    expect(result.accessToken).toBe('acc-token-123');
    expect(result.user.email).toBe('user@trimonarch.com');
  });

  it('invokes getCurrentUser endpoint successfully', async () => {
    const mockUser = {
      id: 'usr-1',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active' as const,
      roles: ['admin'],
    };

    vi.spyOn(apiClient, 'get').mockResolvedValue(mockUser);

    const user = await authService.getCurrentUser();
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    expect(user.id).toBe('usr-1');
  });

  it('invokes logout endpoint with refreshToken', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);

    await authService.logout('ref-token-456');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'ref-token-456' });
  });
});
