import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PartnersPage } from '@/pages/PartnersPage';
import { PartnerTable } from '@/features/partners/components/PartnerTable';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { partnersService, Partner } from '@/services/partners.service';

const mockPartners: Partner[] = [
  {
    id: 'part-1',
    name: 'Acme Corp',
    type: 'customer',
    email: 'contact@acme.com',
    phone: '+1 555 1234',
    address: '100 Main St',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'part-2',
    name: 'Global Logistics',
    type: 'supplier',
    email: 'info@globallogistics.com',
    phone: '+1 555 5678',
    status: 'inactive',
    created_at: new Date().toISOString(),
  },
];

describe('Partner Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders PartnerTable with customer and supplier entries and badges', async () => {
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
              <PartnerTable
                partners={mockPartners}
                onView={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
              />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Global Logistics')).toBeInTheDocument();
    expect(screen.getByText('customer')).toBeInTheDocument();
    expect(screen.getByText('supplier')).toBeInTheDocument();
  });

  it('renders PartnersPage with header and records for ADMIN role', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(partnersService, 'getPartners').mockResolvedValue({
      success: true,
      data: mockPartners,
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <PartnersPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Business Partners/i)).toBeInTheDocument();
    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Create Partner')).toBeInTheDocument();
  });

  it('opens Create Partner modal when Create Partner button is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(partnersService, 'getPartners').mockResolvedValue({
      success: true,
      data: mockPartners,
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <PartnersPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const createBtn = await screen.findByText('Create Partner');
    fireEvent.click(createBtn);

    expect(screen.getByText('Create Business Partner')).toBeInTheDocument();
  });
});
