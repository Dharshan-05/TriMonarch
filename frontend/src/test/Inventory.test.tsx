import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { InventoryPage } from '@/pages/InventoryPage';
import { InventoryTable } from '@/features/inventory/components/InventoryTable';
import { InventoryKpiGrid } from '@/features/inventory/components/InventoryKpiGrid';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { inventoryService, Inventory } from '@/services/inventory.service';

const mockInventory: Inventory[] = [
  {
    id: 'inv-1',
    organization_id: 'org-1',
    product_id: 'prod-101',
    warehouse_id: 'wh-main',
    sku: 'SKU-STEEL-101',
    product_name: 'Industrial Steel Plate',
    warehouse_name: 'Main Distribution Hub',
    quantity: '500.0000',
    reorder_level: '50.0000',
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-2',
    organization_id: 'org-1',
    product_id: 'prod-102',
    warehouse_id: 'wh-main',
    sku: 'SKU-BOLT-M8',
    product_name: 'Hex Bolt M8x30',
    warehouse_name: 'Main Distribution Hub',
    quantity: '15.0000',
    reorder_level: '20.0000',
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-3',
    organization_id: 'org-1',
    product_id: 'prod-103',
    warehouse_id: 'wh-main',
    sku: 'SKU-GASKET-10',
    product_name: 'Rubber Gasket 10mm',
    warehouse_name: 'Main Distribution Hub',
    quantity: '0.0000',
    reorder_level: '10.0000',
    created_at: new Date().toISOString(),
  },
];

describe('Inventory Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders InventoryKpiGrid with correct stock state counts', () => {
    render(<InventoryKpiGrid inventoryList={mockInventory} totalRecords={3} />);

    expect(screen.getByText('Total Stock Records')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Sufficient Stock')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Warnings')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock Items')).toBeInTheDocument();
  });

  it('renders InventoryTable with quantities and stock status badges', async () => {
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
              <InventoryTable
                inventory={mockInventory}
                onView={vi.fn()}
                onAdjust={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
              />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getByText('Industrial Steel Plate')).toBeInTheDocument();
    expect(screen.getByText('SKU-STEEL-101')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('renders InventoryPage with header, KPI cards, and table for ADMIN role', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(inventoryService, 'getInventory').mockResolvedValue({
      success: true,
      data: mockInventory,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <InventoryPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Inventory & Stock State/i)).toBeInTheDocument();
    expect(await screen.findByText('Industrial Steel Plate')).toBeInTheDocument();
    expect(screen.getByText('Create Stock Entry')).toBeInTheDocument();
  });

  it('opens Adjust Stock modal when Stock Adjustment action is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(inventoryService, 'getInventory').mockResolvedValue({
      success: true,
      data: mockInventory,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <InventoryPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const adjustBtns = await screen.findAllByTitle('Adjust Stock Quantity');
    expect(adjustBtns.length).toBeGreaterThan(0);
    fireEvent.click(adjustBtns[0]);

    expect(screen.getByText('Stock Adjustment Transaction')).toBeInTheDocument();
  });
});
