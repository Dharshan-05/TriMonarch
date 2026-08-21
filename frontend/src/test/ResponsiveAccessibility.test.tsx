import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ApplicationShell } from '@/components/layout/ApplicationShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { ToastProvider } from '@/features/notifications';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';

describe('Phase 100 — Responsive & Accessibility Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders skip link and main landmark with tabIndex={-1} in ApplicationShell', async () => {
    tokenManager.setAccessToken('mock-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-01',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <MemoryRouter>
                <ApplicationShell />
              </MemoryRouter>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    const mainLandmark = screen.getByRole('main');
    expect(mainLandmark).toHaveAttribute('id', 'main-content');
    expect(mainLandmark).toHaveAttribute('tabindex', '-1');
  });

  it('toggles mobile sidebar drawer and responds to Escape key close', async () => {
    tokenManager.setAccessToken('mock-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-01',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    const handleClose = vi.fn();
    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <Sidebar isOpen={true} onClose={handleClose} isCollapsed={false} onToggleCollapse={vi.fn()} />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const sidebarNav = screen.getByLabelText('Sidebar Navigation');
    expect(sidebarNav).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders Table container with role="region", aria-label, and keyboard tabIndex={0}', () => {
    render(
      <Table containerLabel="Product Inventory Table">
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>WGT-001</TableCell>
            <TableCell>Widget Alpha</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const tableRegion = screen.getByRole('region', { name: 'Product Inventory Table' });
    expect(tableRegion).toBeInTheDocument();
    expect(tableRegion).toHaveAttribute('tabindex', '0');
  });

  it('renders Dialog with ARIA modal semantics and Escape key listener', () => {
    const handleOpenChange = vi.fn();

    render(
      <Dialog open={true} onOpenChange={handleOpenChange} title="Product Inspector" description="Details for SKU WGT-001">
        <p>Modal content details</p>
      </Dialog>,
    );

    const dialogEl = screen.getByRole('dialog');
    expect(dialogEl).toBeInTheDocument();
    expect(dialogEl).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Product Inspector')).toBeInTheDocument();
    expect(screen.getByText('Details for SKU WGT-001')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
