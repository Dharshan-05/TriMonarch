import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductTable } from '@/features/products/components/ProductTable';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { productsService, Product } from '@/services/products.service';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'SKU-STEEL-101',
    name: 'Industrial Steel Plate',
    category: 'Raw Material',
    unit: 'pcs',
    price: '1250.0000',
    cost: '850.0000',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    sku: 'SKU-BOLT-M8',
    name: 'Hex Bolt M8x30',
    category: 'Component',
    unit: 'box',
    price: '45.5000',
    cost: '22.1000',
    status: 'inactive',
    created_at: new Date().toISOString(),
  },
];

describe('Product Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders ProductTable with SKU, prices, and status badges', async () => {
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
              <ProductTable
                products={mockProducts}
                onView={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
              />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getByText('SKU-STEEL-101')).toBeInTheDocument();
    expect(screen.getByText('Industrial Steel Plate')).toBeInTheDocument();
    expect(screen.getByText('SKU-BOLT-M8')).toBeInTheDocument();
    expect(screen.getByText('Hex Bolt M8x30')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });

  it('renders ProductsPage with header and records for ADMIN role', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(productsService, 'getProducts').mockResolvedValue({
      success: true,
      data: mockProducts,
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <ProductsPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Products & Master Catalog/i)).toBeInTheDocument();
    expect(await screen.findByText('SKU-STEEL-101')).toBeInTheDocument();
    expect(screen.getByText('Create Product')).toBeInTheDocument();
  });

  it('opens Create Product modal when Create Product button is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(productsService, 'getProducts').mockResolvedValue({
      success: true,
      data: mockProducts,
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <ProductsPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const createBtn = await screen.findByText('Create Product');
    fireEvent.click(createBtn);

    expect(screen.getByText('Create ERP Product')).toBeInTheDocument();
  });
});
