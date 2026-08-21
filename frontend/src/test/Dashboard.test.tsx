import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { KpiGrid } from '@/features/dashboard/components/KpiGrid';
import { AttentionAlerts } from '@/features/dashboard/components/AttentionAlerts';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { inventoryService, Inventory } from '@/services/inventory.service';
import { salesOrdersService, SalesOrder } from '@/services/salesOrders.service';
import { purchaseOrdersService, PurchaseOrder } from '@/services/purchaseOrders.service';

describe('Dashboard Component Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders KpiGrid with numerical metrics', () => {
    render(
      <KpiGrid
        productsCount={120}
        lowStockCount={5}
        pendingSalesCount={14}
        pendingPurchaseCount={8}
        activeManufacturingCount={3}
        usersCount={25}
      />,
    );

    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('renders AttentionAlerts when low stock items exist', () => {
    render(
      <MemoryRouter>
        <AttentionAlerts
          outOfStockCount={1}
          lowStockCount={2}
          lowStockItems={[
            { id: '1', sku: 'SKU-001', name: 'Widget A', quantity: 2, status: 'low_stock' },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Critical Stock Depletion/i)).toBeInTheDocument();
    expect(screen.getByText(/Reorder Threshold Reached/i)).toBeInTheDocument();
  });

  it('renders full operational dashboard for ADMIN role', async () => {
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
      data: [{ id: '1', product_id: 'p1', warehouse_id: 'w1', quantity: '2.0000', reorder_level: '5.0000' } as Inventory],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    vi.spyOn(salesOrdersService, 'getSalesOrders').mockResolvedValue({
      success: true,
      data: [{ id: 'so-1', status: 'draft' } as unknown as SalesOrder],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    vi.spyOn(purchaseOrdersService, 'getPurchaseOrders').mockResolvedValue({
      success: true,
      data: [{ id: 'po-1', status: 'draft' } as unknown as PurchaseOrder],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <DashboardPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Enterprise Dashboard/i)).toBeInTheDocument();
    expect(await screen.findByText(/Inventory Health Breakdown/i)).toBeInTheDocument();
    expect(await screen.findByText(/Sales Orders Overview/i)).toBeInTheDocument();
  });
});
