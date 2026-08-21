import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { AuditLogTable } from '@/features/audit-logs/components/AuditLogTable';
import { AuditLogKpiGrid } from '@/features/audit-logs/components/AuditLogKpiGrid';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { tokenManager } from '@/lib/auth/token-manager';
import { authService } from '@/features/auth/services/auth.service';
import { auditLogsService, AuditLog } from '@/services/auditLogs.service';

const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-001-uuid',
    organization_id: 'org-1',
    user_id: 'usr-admin-01',
    actor_id: 'usr-admin-01',
    category: 'CATEGORY_A',
    action: 'CREATE',
    entity_type: 'PRODUCT',
    entity_id: 'prod-wgt-01',
    request_id: 'req-abc-123',
    correlation_id: 'corr-xyz-999',
    reason: 'Initial master product creation',
    before_snapshot: null,
    after_snapshot: { sku: 'WGT-001', name: 'Widget Alpha', status: 'active' },
    success: true,
    metadata: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'audit-002-uuid',
    organization_id: 'org-1',
    user_id: 'usr-manager-02',
    actor_id: 'usr-manager-02',
    category: 'CATEGORY_B',
    action: 'UPDATE',
    entity_type: 'WAREHOUSE',
    entity_id: 'wh-main-01',
    request_id: 'req-def-456',
    correlation_id: 'corr-xyz-999',
    reason: 'Updated warehouse location address',
    before_snapshot: { name: 'Main Hub', location: 'Building 3' },
    after_snapshot: { name: 'Main Central Hub', location: 'Building 4' },
    success: true,
    metadata: { ip: '10.0.0.42' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'audit-003-uuid',
    organization_id: 'org-1',
    user_id: 'usr-unknown',
    actor_id: 'usr-unknown',
    category: 'CATEGORY_C',
    action: 'AUTH_FAILURE',
    entity_type: 'AUTHENTICATION',
    entity_id: null,
    request_id: 'req-err-789',
    correlation_id: null,
    reason: 'Invalid password attempt',
    before_snapshot: null,
    after_snapshot: null,
    success: false,
    metadata: { ip: '203.0.113.5' },
    created_at: new Date().toISOString(),
  },
];

describe('Audit Logs Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenManager.clearTokens();
  });

  it('renders AuditLogKpiGrid with event summary metrics', () => {
    render(<AuditLogKpiGrid logs={mockAuditLogs} totalRecords={3} />);

    expect(screen.getByText('Total Audit Events')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getByText('Create Operations')).toBeInTheDocument();
    expect(screen.getByText('Update Operations')).toBeInTheDocument();
    expect(screen.getByText('Security & Auth Alerts')).toBeInTheDocument();
  });

  it('renders AuditLogTable with action badges, entity badges, and monospace identifiers', () => {
    render(
      <MemoryRouter>
        <AuditLogTable logs={mockAuditLogs} onViewDetails={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('CREATE')).toBeInTheDocument();
    expect(screen.getByText('UPDATE')).toBeInTheDocument();
    expect(screen.getByText('AUTH_FAILURE')).toBeInTheDocument();
    expect(screen.getByText('PRODUCT')).toBeInTheDocument();
    expect(screen.getByText('WAREHOUSE')).toBeInTheDocument();
    expect(screen.getByText('AUTHENTICATION')).toBeInTheDocument();
    expect(screen.getByText('usr-admin-01')).toBeInTheDocument();
    expect(screen.getByText('prod-wgt-01')).toBeInTheDocument();
    expect(screen.getAllByText('SUCCESS').length).toBeGreaterThan(0);
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('renders AuditLogsPage with header, KPI cards, and table for AUDITOR role', async () => {
    tokenManager.setAccessToken('auditor-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-auditor',
      email: 'auditor@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['AUDITOR'],
    });

    vi.spyOn(auditLogsService, 'getAuditLogs').mockResolvedValue({
      success: true,
      data: mockAuditLogs,
      meta: { page: 1, pageSize: 20, total: 3, totalPages: 1 },
    });

    vi.spyOn(auditLogsService, 'getStats').mockResolvedValue({
      totalLogs: 3,
      actionBreakdown: [
        { action: 'CREATE', count: 1 },
        { action: 'UPDATE', count: 1 },
        { action: 'AUTH_FAILURE', count: 1 },
      ],
      entityBreakdown: [
        { entity_type: 'PRODUCT', count: 1 },
        { entity_type: 'WAREHOUSE', count: 1 },
      ],
      topUsers: [{ user_id: 'usr-admin-01', count: 1 }],
    });

    vi.spyOn(auditLogsService, 'getAvailableEvents').mockResolvedValue(['CREATE', 'UPDATE', 'AUTH_FAILURE']);

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <AuditLogsPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    expect(await screen.findByText(/Audit Trail & Security Log/i)).toBeInTheDocument();
    expect((await screen.findAllByText('CREATE')).length).toBeGreaterThan(0);
    expect(screen.getByText('Refresh Trail')).toBeInTheDocument();
  });

  it('opens Audit Log Detail modal when view details action is clicked', async () => {
    tokenManager.setAccessToken('admin-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
      id: 'usr-admin',
      email: 'admin@trimonarch.com',
      organization_id: 'org-1',
      status: 'active',
      roles: ['ADMIN'],
    });

    vi.spyOn(auditLogsService, 'getAuditLogs').mockResolvedValue({
      success: true,
      data: mockAuditLogs,
      meta: { page: 1, pageSize: 20, total: 3, totalPages: 1 },
    });

    await act(async () => {
      render(
        <QueryProvider>
          <AuthProvider>
            <MemoryRouter>
              <AuditLogsPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryProvider>,
      );
    });

    const detailButtons = await screen.findAllByText('Details');
    fireEvent.click(detailButtons[0]);

    expect(screen.getByText('Audit Event Inspector')).toBeInTheDocument();
    expect(screen.getByText('Audit ID: audit-001-uuid')).toBeInTheDocument();
    expect(screen.getByText(/Initial master product creation/i)).toBeInTheDocument();
    expect(screen.getByText('Copy JSON Payload')).toBeInTheDocument();
  });
});
