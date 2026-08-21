import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WarehousesPage } from '@/pages/WarehousesPage';
import { WarehouseTable } from '@/features/warehouses/components/WarehouseTable';
import { WarehouseKpiGrid } from '@/features/warehouses/components/WarehouseKpiGrid';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { warehousesService, Warehouse } from '@/services/warehouses.service';

const mockWarehouses: Warehouse[] = [
  {
    id: 'wh-main',
    organization_id: 'org-1',
    code: 'WH-MAIN-01',
    name: 'Main Central Hub',
    location: 'Building 4, Logistics Park, Sector 62',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wh-north',
    organization_id: 'org-1',
    code: 'WH-NORTH-02',
    name: 'North Region Depot',
    location: 'Plot 12, Industrial Area Phase II',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wh-old',
    organization_id: 'org-1',
    code: 'WH-OLD-99',
    name: 'Legacy Storage Shed',
    location: 'Old Port Road',
    status: 'inactive',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('Warehouse Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders WarehouseKpiGrid with active and inactive facility metrics', () => {
    render(<WarehouseKpiGrid warehouses={mockWarehouses} totalRecords={3} />);

    expect(screen.getByText('Total Facilities')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getByText('Active Warehouses')).toBeInTheDocument();
    expect(screen.getByText('Inactive Facilities')).toBeInTheDocument();
  });

  it('renders WarehouseTable with facility names, monospace codes, and status badges', async () => {
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
              <WarehouseTable
                warehouses={mockWarehouses}
                onView={vi.fn()}
                onEdit={vi.fn()}
              />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(screen.getByText('Main Central Hub')).toBeInTheDocument();
    expect(screen.getByText('WH-MAIN-01')).toBeInTheDocument();
    expect(screen.getByText('North Region Depot')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders WarehousesPage with header, KPI cards, and table for ADMIN role', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(warehousesService, 'getWarehouses').mockResolvedValue({
      success: true,
      data: mockWarehouses,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <WarehousesPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Warehouse Facilities Management/i)).toBeInTheDocument();
    expect(await screen.findByText('Main Central Hub')).toBeInTheDocument();
    expect(screen.getByText('Add Warehouse')).toBeInTheDocument();
  });

  it('opens Create Warehouse modal when Add Warehouse button is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(warehousesService, 'getWarehouses').mockResolvedValue({
      success: true,
      data: mockWarehouses,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <WarehousesPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const addBtn = await screen.findByText('Add Warehouse');
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Warehouse Facility')).toBeInTheDocument();
  });
});
