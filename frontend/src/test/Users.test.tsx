import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UsersPage } from '@/pages/UsersPage';
import { UserTable } from '@/features/users/components/UserTable';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { usersService, User } from '@/services/users.service';

const mockUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Alice Smith',
    email: 'alice@trimonarch.com',
    role: 'ADMIN',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    name: 'Bob Jones',
    email: 'bob@trimonarch.com',
    role: 'EMPLOYEE',
    status: 'inactive',
    created_at: new Date().toISOString(),
  },
];

describe('User Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders UserTable with user entries and badges', async () => {
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
              <UserTable
                users={mockUsers}
                onView={vi.fn()}
                onEdit={vi.fn()}
                onDeactivate={vi.fn()}
              />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@trimonarch.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders UsersPage with header and user records for ADMIN role', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(usersService, 'getUsers').mockResolvedValue({
      success: true,
      data: mockUsers,
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <UsersPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Users Management/i)).toBeInTheDocument();
    expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Create User')).toBeInTheDocument();
  });

  it('opens Create User modal when Create User button is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(usersService, 'getUsers').mockResolvedValue({
      success: true,
      data: mockUsers,
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <UsersPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const createBtn = await screen.findByText('Create User');
    fireEvent.click(createBtn);

    expect(screen.getByText('Create System User')).toBeInTheDocument();
  });
});
