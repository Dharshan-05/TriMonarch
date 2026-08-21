import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SalesOrdersPage } from '@/pages/SalesOrdersPage';
import { SalesOrderTable } from '@/features/sales-orders/components/SalesOrderTable';
import { SalesOrderKpiGrid } from '@/features/sales-orders/components/SalesOrderKpiGrid';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { salesOrdersService, SalesOrder } from '@/services/salesOrders.service';

const mockSalesOrders: SalesOrder[] = [
  {
    id: 'so-101',
    organization_id: 'org-1',
    customer_id: 'cust-201',
    customer_name: 'Acme Corporation',
    order_number: 'SO-2026-0001',
    order_date: new Date().toISOString(),
    status: 'draft',
    currency: 'USD',
    subtotal: '1000.0000',
    tax_amount: '180.0000',
    discount_amount: '0.0000',
    total_amount: '1180.0000',
    notes: 'Urgent delivery required',
    created_at: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        product_id: 'prod-1',
        product_name: 'Industrial Steel Plate',
        sku: 'SKU-STEEL-101',
        quantity: '10.0000',
        unit_price: '100.0000',
        tax_rate: '18.000000',
        tax_amount: '180.0000',
        line_total: '1180.0000',
      },
    ],
  },
  {
    id: 'so-102',
    organization_id: 'org-1',
    customer_id: 'cust-202',
    customer_name: 'Global Tech Solutions',
    order_number: 'SO-2026-0002',
    order_date: new Date().toISOString(),
    status: 'confirmed',
    currency: 'USD',
    subtotal: '2500.0000',
    tax_amount: '300.0000',
    discount_amount: '0.0000',
    total_amount: '2800.0000',
    notes: 'Standard NET30 terms',
    created_at: new Date().toISOString(),
  },
  {
    id: 'so-103',
    organization_id: 'org-1',
    customer_id: 'cust-203',
    customer_name: 'Apex Industrial Parts',
    order_number: 'SO-2026-0003',
    order_date: new Date().toISOString(),
    status: 'cancelled',
    currency: 'USD',
    subtotal: '500.0000',
    tax_amount: '60.0000',
    discount_amount: '0.0000',
    total_amount: '560.0000',
    notes: 'Cancelled by customer',
    created_at: new Date().toISOString(),
  },
];

describe('Sales Orders Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders SalesOrderKpiGrid with operational summary metrics', () => {
    render(<SalesOrderKpiGrid orders={mockSalesOrders} totalRecords={3} />);

    expect(screen.getByText('Total Sales Orders')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Draft Orders')).toBeInTheDocument();
    expect(screen.getByText('Active / Processing')).toBeInTheDocument();
    expect(screen.getByText('Total Order Value')).toBeInTheDocument();
  });

  it('renders SalesOrderTable with order references, statuses, and amounts', async () => {
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
              <SalesOrderTable
                orders={mockSalesOrders}
                onView={vi.fn()}
                onConfirm={vi.fn()}
                onEdit={vi.fn()}
                onCancel={vi.fn()}
                onDelete={vi.fn()}
              />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getByText('SO-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders SalesOrdersPage for ADMIN role with header, KPI cards, and order table', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(salesOrdersService, 'getSalesOrders').mockResolvedValue({
      success: true,
      data: mockSalesOrders,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <SalesOrdersPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Sales Orders Pipeline/i)).toBeInTheDocument();
    expect(await screen.findByText('SO-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Create Sales Order')).toBeInTheDocument();
  });

  it('opens Sales Order Detail modal when view details action is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(salesOrdersService, 'getSalesOrders').mockResolvedValue({
      success: true,
      data: mockSalesOrders,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <SalesOrdersPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const viewBtns = await screen.findAllByTitle('View Details');
    expect(viewBtns.length).toBeGreaterThan(0);
    fireEvent.click(viewBtns[0]);

    expect(screen.getByText('Sales Order Summary Profile')).toBeInTheDocument();
  });
});
