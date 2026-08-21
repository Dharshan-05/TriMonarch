import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PurchaseOrdersPage } from '@/pages/PurchaseOrdersPage';
import { PurchaseOrderTable } from '@/features/purchase-orders/components/PurchaseOrderTable';
import { PurchaseOrderKpiGrid } from '@/features/purchase-orders/components/PurchaseOrderKpiGrid';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { purchaseOrdersService, PurchaseOrder } from '@/services/purchaseOrders.service';

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-101',
    organization_id: 'org-1',
    supplier_id: 'supp-301',
    supplier_name: 'Apex Raw Materials Co',
    order_number: 'PO-2026-0001',
    order_date: new Date().toISOString(),
    status: 'draft',
    currency: 'USD',
    subtotal: '2000.0000',
    tax_amount: '360.0000',
    discount_amount: '0.0000',
    total_amount: '2360.0000',
    notes: 'Q3 Batch steel supply',
    created_at: new Date().toISOString(),
    items: [
      {
        id: 'po-item-1',
        product_id: 'prod-1',
        product_name: 'Industrial Steel Plate',
        sku: 'SKU-STEEL-101',
        quantity: '20.0000',
        unit_cost: '100.0000',
        tax_rate: '18.000000',
        tax_amount: '360.0000',
        line_total: '2360.0000',
      },
    ],
  },
  {
    id: 'po-102',
    organization_id: 'org-1',
    supplier_id: 'supp-302',
    supplier_name: 'Global Metals Supply',
    order_number: 'PO-2026-0002',
    order_date: new Date().toISOString(),
    status: 'approved',
    currency: 'USD',
    subtotal: '4500.0000',
    tax_amount: '540.0000',
    discount_amount: '0.0000',
    total_amount: '5040.0000',
    notes: 'Approved by procurement lead',
    created_at: new Date().toISOString(),
  },
  {
    id: 'po-103',
    organization_id: 'org-1',
    supplier_id: 'supp-303',
    supplier_name: 'Titanium Alloys Ltd',
    order_number: 'PO-2026-0003',
    order_date: new Date().toISOString(),
    status: 'cancelled',
    currency: 'USD',
    subtotal: '1200.0000',
    tax_amount: '144.0000',
    discount_amount: '0.0000',
    total_amount: '1344.0000',
    notes: 'Vendor out of stock',
    created_at: new Date().toISOString(),
  },
];

describe('Purchase Orders Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders PurchaseOrderKpiGrid with operational summary metrics', () => {
    render(<PurchaseOrderKpiGrid orders={mockPurchaseOrders} totalRecords={3} />);

    expect(screen.getByText('Total Purchase Orders')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Draft Purchase Orders')).toBeInTheDocument();
    expect(screen.getByText('Approved / Active POs')).toBeInTheDocument();
    expect(screen.getByText('Total Procurement Value')).toBeInTheDocument();
  });

  it('renders PurchaseOrderTable with references, supplier names, and statuses', async () => {
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
              <PurchaseOrderTable
                orders={mockPurchaseOrders}
                onView={vi.fn()}
                onSubmitOrder={vi.fn()}
                onApproveOrder={vi.fn()}
                onEdit={vi.fn()}
                onCancel={vi.fn()}
                onDelete={vi.fn()}
              />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getByText('PO-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Apex Raw Materials Co')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders PurchaseOrdersPage for ADMIN role with header, KPI cards, and PO table', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(purchaseOrdersService, 'getPurchaseOrders').mockResolvedValue({
      success: true,
      data: mockPurchaseOrders,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <PurchaseOrdersPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Purchase Orders Procurement/i)).toBeInTheDocument();
    expect(await screen.findByText('PO-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Create Purchase Order')).toBeInTheDocument();
  });

  it('opens Purchase Order Detail modal when view details action is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(purchaseOrdersService, 'getPurchaseOrders').mockResolvedValue({
      success: true,
      data: mockPurchaseOrders,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <PurchaseOrdersPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const viewBtns = await screen.findAllByTitle('View Order Details');
    expect(viewBtns.length).toBeGreaterThan(0);
    fireEvent.click(viewBtns[0]);

    expect(screen.getByText('Purchase Order Summary Profile')).toBeInTheDocument();
    expect(screen.getByText('View Goods Receipts')).toBeInTheDocument();
    expect(screen.getByText('View Stock Ledger')).toBeInTheDocument();
  });
});
