import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthorizationRoute } from '@/components/routing/AuthorizationRoute';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';

const ProtectedContent = () => <div>Sensitive Admin Data</div>;

describe('AuthorizationRoute Access Control', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders route content when user possesses required permission', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={['/admin-area']}>
              <Routes>
                <Route path="/403" element={<ForbiddenPage />} />
                <Route element={<AuthorizationRoute access={{ permissions: ['user:read'] }} />}>
                  <Route path="/admin-area" element={<ProtectedContent />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText('Sensitive Admin Data')).toBeInTheDocument();
  });

  it('redirects user to /403 when user lacks required permission', async () => {
    tokenManager.setAccessToken('emp-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-emp',
      email: 'employee@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['EMPLOYEE'],
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={['/admin-area']}>
              <Routes>
                <Route path="/403" element={<ForbiddenPage />} />
                <Route element={<AuthorizationRoute access={{ permissions: ['user:read'] }} />}>
                  <Route path="/admin-area" element={<ProtectedContent />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/403 — Access Denied/i)).toBeInTheDocument();
    expect(screen.queryByText('Sensitive Admin Data')).not.toBeInTheDocument();
  });
});
