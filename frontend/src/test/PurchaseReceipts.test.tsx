import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PurchaseReceiptsPage } from '@/pages/PurchaseReceiptsPage';
import { PurchaseReceiptTable } from '@/features/purchase-receipts/components/PurchaseReceiptTable';
import { PurchaseReceiptKpiGrid } from '@/features/purchase-receipts/components/PurchaseReceiptKpiGrid';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { purchaseReceiptsService, PurchaseReceipt } from '@/services/purchaseReceipts.service';

const mockPurchaseReceipts: PurchaseReceipt[] = [
  {
    id: 'rec-101',
    organization_id: 'org-1',
    purchase_order_id: 'po-101',
    order_number: 'PO-2026-0001',
    receipt_number: 'REC-2026-0001',
    warehouse_id: 'wh-1',
    warehouse_name: 'Main Distribution Warehouse',
    status: 'draft',
    receipt_date: new Date().toISOString(),
    notes: 'Partial shipment arrival',
    created_at: new Date().toISOString(),
    items: [
      {
        id: 'rec-item-1',
        purchase_order_item_id: 'po-item-1',
        product_id: 'prod-1',
        product_name: 'Industrial Steel Plate',
        sku: 'SKU-STEEL-101',
        quantity: '20.0000',
        unit_cost: '100.0000',
      },
    ],
  },
  {
    id: 'rec-102',
    organization_id: 'org-1',
    purchase_order_id: 'po-102',
    order_number: 'PO-2026-0002',
    receipt_number: 'REC-2026-0002',
    warehouse_id: 'wh-1',
    warehouse_name: 'Main Distribution Warehouse',
    status: 'posted',
    receipt_date: new Date().toISOString(),
    received_at: new Date().toISOString(),
    notes: 'Inventory stock added',
    created_at: new Date().toISOString(),
  },
  {
    id: 'rec-103',
    organization_id: 'org-1',
    purchase_order_id: 'po-103',
    order_number: 'PO-2026-0003',
    receipt_number: 'REC-2026-0003',
    warehouse_id: 'wh-2',
    warehouse_name: 'Secondary Warehouse',
    status: 'completed',
    receipt_date: new Date().toISOString(),
    notes: 'Finalized goods receipt',
    created_at: new Date().toISOString(),
  },
];

describe('Purchase Receipts Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders PurchaseReceiptKpiGrid with operational summary metrics', () => {
    render(<PurchaseReceiptKpiGrid receipts={mockPurchaseReceipts} totalRecords={3} />);

    expect(screen.getByText('Total Goods Receipts')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Draft Receipts')).toBeInTheDocument();
    expect(screen.getByText('Posted (Stock Received)')).toBeInTheDocument();
    expect(screen.getByText('Completed Receipts')).toBeInTheDocument();
  });

  it('renders PurchaseReceiptTable with references, status badges, and action buttons', async () => {
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
              <PurchaseReceiptTable
                receipts={mockPurchaseReceipts}
                onView={vi.fn()}
                onPostReceipt={vi.fn()}
                onCompleteReceipt={vi.fn()}
                onCancelReceipt={vi.fn()}
              />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getByText('REC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('PO-2026-0001')).toBeInTheDocument();
    expect(screen.getAllByText('Main Distribution Warehouse').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Posted (In Stock)')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders PurchaseReceiptsPage for ADMIN role with header, KPI cards, and receipt table', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(purchaseReceiptsService, 'getPurchaseReceipts').mockResolvedValue({
      success: true,
      data: mockPurchaseReceipts,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <PurchaseReceiptsPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Purchase Goods Receipts/i)).toBeInTheDocument();
    expect(await screen.findByText('REC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Receive PO Goods')).toBeInTheDocument();
  });

  it('opens Purchase Receipt Detail modal when view inspector action is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(purchaseReceiptsService, 'getPurchaseReceipts').mockResolvedValue({
      success: true,
      data: mockPurchaseReceipts,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <PurchaseReceiptsPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const viewBtns = await screen.findAllByTitle('View Receipt Inspector');
    expect(viewBtns.length).toBeGreaterThan(0);
    fireEvent.click(viewBtns[0]);

    expect(screen.getByText('Goods Receipt Summary Profile')).toBeInTheDocument();
    expect(screen.getByText('View Purchase Orders')).toBeInTheDocument();
    expect(screen.getByText('View Inventory')).toBeInTheDocument();
    expect(screen.getByText('View Stock Ledger')).toBeInTheDocument();
  });
});
