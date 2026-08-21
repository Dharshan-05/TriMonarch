import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '@/features/auth/context/auth-context';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { QueryProvider } from '@/app/providers/QueryProvider';

const TestComponent = () => {
  const { user, isAuthenticated, isInitializing, logout } = useAuth();
  if (isInitializing) return <div>Initializing...</div>;
  return (
    <div>
      <div>{isAuthenticated ? `Authenticated as ${user?.email}` : 'Unauthenticated'}</div>
      {isAuthenticated && <button onClick={() => logout()}>Logout Test</button>}
    </div>
  );
};

describe('AuthContext & Session Management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('initializes as unauthenticated when no token is stored', async () => {
    render(
      <QueryProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </QueryProvider>,
    );

    expect(await screen.findByText('Unauthenticated')).toBeInTheDocument();
  });

  it('restores session when valid access token exists', async () => {
    tokenManager.setAccessToken('valid-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-1',
      email: 'session@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
    });

    render(
      <QueryProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </QueryProvider>,
    );

    expect(await screen.findByText('Authenticated as session@trimonarch.com')).toBeInTheDocument();
  });

  it('clears tokens and updates state on logout', async () => {
    tokenManager.setAccessToken('valid-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-1',
      email: 'session@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
    });
    vi.spyOn(authService, 'logout').mockResolvedValue();

    render(
      <QueryProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </QueryProvider>,
    );

    expect(await screen.findByText('Authenticated as session@trimonarch.com')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /logout test/i });
    await act(async () => {
      logoutBtn.click();
    });

    expect(await screen.findByText('Unauthenticated')).toBeInTheDocument();
    expect(tokenManager.getAccessToken()).toBeNull();
  });
});
