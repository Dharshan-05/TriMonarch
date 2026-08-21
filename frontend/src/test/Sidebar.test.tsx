import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';

describe('Sidebar Navigation Filtering', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders all navigation items for ADMIN role', async () => {
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
            <MemoryRouter>
              <Sidebar isOpen={true} onClose={() => {}} isCollapsed={false} onToggleCollapse={() => {}} />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Users')).toBeInTheDocument();
    expect(await screen.findByText('Products & Items')).toBeInTheDocument();
    expect(await screen.findByText('Audit Trail')).toBeInTheDocument();
  });

  it('hides Admin-restricted navigation items for EMPLOYEE role', async () => {
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
            <MemoryRouter>
              <Sidebar isOpen={true} onClose={() => {}} isCollapsed={false} onToggleCollapse={() => {}} />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Products & Items')).toBeInTheDocument();

    // EMPLOYEE role does not have user:read or audit:read permissions
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Audit Trail')).not.toBeInTheDocument();
  });
});
