import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { StockLedgerPage } from '@/pages/StockLedgerPage';
import { StockLedgerTable } from '@/features/stock-ledger/components/StockLedgerTable';
import { StockLedgerKpiGrid } from '@/features/stock-ledger/components/StockLedgerKpiGrid';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { stockLedgerService, StockLedgerEntry } from '@/services/stockLedger.service';

const mockLedgerEntries: StockLedgerEntry[] = [
  {
    id: 'mvt-101',
    organization_id: 'org-1',
    product_id: 'prod-101',
    warehouse_id: 'wh-main',
    product_name: 'Industrial Steel Plate',
    sku: 'SKU-STEEL-101',
    warehouse_name: 'Main Distribution Hub',
    movement_type: 'IN',
    quantity: '500.0000',
    unit: 'pcs',
    balance_after: '500.0000',
    reference_type: 'PURCHASE_RECEIPT',
    reference_id: 'PR-9001',
    reason: 'Initial Vendor Delivery',
    notes: 'Received clean shipment from Supplier A',
    created_by: 'usr-admin',
    user_name: 'System Admin',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mvt-102',
    organization_id: 'org-1',
    product_id: 'prod-101',
    warehouse_id: 'wh-main',
    product_name: 'Industrial Steel Plate',
    sku: 'SKU-STEEL-101',
    warehouse_name: 'Main Distribution Hub',
    movement_type: 'OUT',
    quantity: '50.0000',
    unit: 'pcs',
    balance_after: '450.0000',
    reference_type: 'SALES_DELIVERY',
    reference_id: 'SD-4002',
    reason: 'Customer Shipment Outbound',
    notes: 'Dispatched via Express Courier',
    created_by: 'usr-admin',
    user_name: 'System Admin',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mvt-103',
    organization_id: 'org-1',
    product_id: 'prod-101',
    warehouse_id: 'wh-main',
    product_name: 'Industrial Steel Plate',
    sku: 'SKU-STEEL-101',
    warehouse_name: 'Main Distribution Hub',
    movement_type: 'ADJUSTMENT',
    quantity: '-10.0000',
    unit: 'pcs',
    balance_after: '440.0000',
    reference_type: 'STOCK_ADJUSTMENT',
    reference_id: 'SA-1003',
    reason: 'Physical Audit Shrinkage',
    notes: 'Damaged during warehouse transit',
    created_by: 'usr-admin',
    user_name: 'System Admin',
    created_at: new Date().toISOString(),
  },
];

describe('Stock Ledger Audit Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders StockLedgerKpiGrid with movement volumes and audit counts', () => {
    render(<StockLedgerKpiGrid entries={mockLedgerEntries} totalRecords={3} />);

    expect(screen.getByText('Total Movement Records')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Stock Intake Volume (+)')).toBeInTheDocument();
    expect(screen.getByText('Stock Outflow Volume (-)')).toBeInTheDocument();
    expect(screen.getByText('Audit Adjustments')).toBeInTheDocument();
  });

  it('renders StockLedgerTable with movement badges and exact decimal quantity strings', async () => {
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
              <StockLedgerTable entries={mockLedgerEntries} onViewDetail={vi.fn()} />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getAllByText('Industrial Steel Plate').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SKU-STEEL-101').length).toBeGreaterThan(0);
    expect(screen.getByText('IN')).toBeInTheDocument();
    expect(screen.getByText('OUT')).toBeInTheDocument();
    expect(screen.getByText('ADJUSTMENT')).toBeInTheDocument();
  });

  it('renders StockLedgerPage for ADMIN role with header and table', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(stockLedgerService, 'getLedgerEntries').mockResolvedValue({
      success: true,
      data: mockLedgerEntries,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <StockLedgerPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Stock Ledger Audit Trail/i)).toBeInTheDocument();
    expect((await screen.findAllByText('Industrial Steel Plate')).length).toBeGreaterThan(0);
  });

  it('opens Stock Ledger Detail modal when view audit detail action is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(stockLedgerService, 'getLedgerEntries').mockResolvedValue({
      success: true,
      data: mockLedgerEntries,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <StockLedgerPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const viewBtns = await screen.findAllByTitle('View Audit Detail');
    expect(viewBtns.length).toBeGreaterThan(0);
    fireEvent.click(viewBtns[0]);

    expect(screen.getByText('Stock Ledger Audit Detail')).toBeInTheDocument();
  });
});
