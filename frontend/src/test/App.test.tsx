import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { App } from '@/app/App';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';

describe('App Bootstrap & Protected Routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('redirects unauthenticated user to login page when accessing protected route', async () => {
    render(
      <QueryProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryProvider>,
    );

    expect(await screen.findByText(/enter your enterprise credentials/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders application shell and enterprise dashboard when authenticated', async () => {
    tokenManager.setAccessToken('mock-valid-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-1',
      email: 'test@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    render(<App />);

    expect(await screen.findByText(/Enterprise Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Mini ERP/i).length).toBeGreaterThan(0);
  });
});
