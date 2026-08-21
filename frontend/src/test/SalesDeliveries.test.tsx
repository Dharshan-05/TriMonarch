import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SalesDeliveriesPage } from '@/pages/SalesDeliveriesPage';
import { SalesDeliveryTable } from '@/features/sales-deliveries/components/SalesDeliveryTable';
import { SalesDeliveryKpiGrid } from '@/features/sales-deliveries/components/SalesDeliveryKpiGrid';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { salesDeliveriesService, SalesDelivery } from '@/services/salesDeliveries.service';

const mockSalesDeliveries: SalesDelivery[] = [
  {
    id: 'del-101',
    organization_id: 'org-1',
    sales_order_id: 'so-201',
    order_number: 'SO-2026-0001',
    delivery_number: 'DEL-2026-0001',
    warehouse_id: 'wh-301',
    warehouse_name: 'Main Distribution Hub',
    status: 'draft',
    delivery_date: new Date().toISOString(),
    notes: 'Fragile dispatch',
    created_at: new Date().toISOString(),
    items: [
      {
        id: 'ditem-1',
        delivery_id: 'del-101',
        sales_order_item_id: 'item-1',
        product_id: 'prod-1',
        product_name: 'Industrial Steel Plate',
        sku: 'SKU-STEEL-101',
        quantity: '10.0000',
      },
    ],
  },
  {
    id: 'del-102',
    organization_id: 'org-1',
    sales_order_id: 'so-202',
    order_number: 'SO-2026-0002',
    delivery_number: 'DEL-2026-0002',
    warehouse_id: 'wh-301',
    warehouse_name: 'Main Distribution Hub',
    status: 'shipped',
    delivery_date: new Date().toISOString(),
    shipped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'del-103',
    organization_id: 'org-1',
    sales_order_id: 'so-203',
    order_number: 'SO-2026-0003',
    delivery_number: 'DEL-2026-0003',
    warehouse_id: 'wh-301',
    warehouse_name: 'Main Distribution Hub',
    status: 'delivered',
    delivery_date: new Date().toISOString(),
    delivered_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

describe('Sales Deliveries Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders SalesDeliveryKpiGrid with operational summary metrics', () => {
    render(<SalesDeliveryKpiGrid deliveries={mockSalesDeliveries} totalRecords={3} />);

    expect(screen.getByText('Total Deliveries')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Fulfillment In-Progress')).toBeInTheDocument();
    expect(screen.getByText('In Transit / Shipped')).toBeInTheDocument();
    expect(screen.getByText('Delivered / Completed')).toBeInTheDocument();
  });

  it('renders SalesDeliveryTable with references, status badges, and action buttons', async () => {
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
              <SalesDeliveryTable
                deliveries={mockSalesDeliveries}
                onView={vi.fn()}
                onTransition={vi.fn()}
                onCancel={vi.fn()}
              />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getByText('DEL-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('SO-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders SalesDeliveriesPage for ADMIN role with header, KPI cards, and delivery table', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(salesDeliveriesService, 'getDeliveries').mockResolvedValue({
      success: true,
      data: mockSalesDeliveries,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <SalesDeliveriesPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Sales Delivery Dispatch/i)).toBeInTheDocument();
    expect(await screen.findByText('DEL-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Create Delivery Dispatch')).toBeInTheDocument();
  });

  it('opens Sales Delivery Detail modal when view action is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(salesDeliveriesService, 'getDeliveries').mockResolvedValue({
      success: true,
      data: mockSalesDeliveries,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <SalesDeliveriesPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const viewBtns = await screen.findAllByTitle('View Delivery Profile');
    expect(viewBtns.length).toBeGreaterThan(0);
    fireEvent.click(viewBtns[0]);

    expect(screen.getByText('Sales Delivery Profile Inspector')).toBeInTheDocument();
    expect(screen.getByText('View Sales Order')).toBeInTheDocument();
    expect(screen.getByText('View Stock Ledger')).toBeInTheDocument();
  });
});
