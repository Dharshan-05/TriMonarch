import React, { useState } from 'react';
import {
  useAuditLogListQuery,
  useAuditLogStatsQuery,
  useAuditLogEventsQuery,
} from '@/features/audit-logs/hooks/useAuditLogs';
import { AuditLogKpiGrid } from '@/features/audit-logs/components/AuditLogKpiGrid';
import { AuditLogToolbar } from '@/features/audit-logs/components/AuditLogToolbar';
import { AuditLogTable } from '@/features/audit-logs/components/AuditLogTable';
import { AuditLogDetailModal } from '@/features/audit-logs/components/AuditLogDetailModal';
import { AuditLogFilterState } from '@/features/audit-logs/types/audit-log.types';
import { AuditLog, AuditQueryParams } from '@/services/auditLogs.service';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

const initialFilters: AuditLogFilterState = {
  search: '',
  category: 'ALL',
  action: 'ALL',
  entity_type: 'ALL',
  entity_id: '',
  user_id: '',
  success: 'ALL',
  startDate: '',
  endDate: '',
  page: 1,
  pageSize: 20,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const AuditLogsPage: React.FC = () => {
  const [filters, setFilters] = useState<AuditLogFilterState>(initialFilters);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const queryParams: AuditQueryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.action !== 'ALL' ? { action: filters.action } : {}),
    ...(filters.entity_type !== 'ALL' ? { entity_type: filters.entity_type } : {}),
    ...(filters.success !== 'ALL' ? { success: filters.success } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
  };

  const { data: auditResponse, isLoading, isError, error, refetch } = useAuditLogListQuery(queryParams);
  const { data: stats } = useAuditLogStatsQuery(queryParams);
  const { data: availableEvents } = useAuditLogEventsQuery();

  const logs = auditResponse?.data || [];
  const meta = auditResponse?.meta || { page: 1, pageSize: 20, total: logs.length, totalPages: 1 };

  const handleFilterChange = (updated: Partial<AuditLogFilterState>) => {
    setFilters((prev) => ({
      ...prev,
      ...updated,
      page: updated.page ?? 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Audit Trail & Security Log</h1>
              <p className="text-xs text-muted-foreground">
                Enterprise compliance history, actor operation logs, and resource state snapshots.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 text-xs gap-1.5"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Trail
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <AuditLogKpiGrid logs={logs} stats={stats} totalRecords={meta.total} />

      {/* Toolbar & Filters */}
      <AuditLogToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        availableEvents={availableEvents}
      />

      {/* Error Alert */}
      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{(error as Error)?.message || 'Failed to retrieve audit log records from server.'}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="h-7 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Audit Log Table */}
      <AuditLogTable logs={logs} isLoading={isLoading} onViewDetails={handleViewDetails} />

      {/* Pagination Controls */}
      {meta.totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 text-xs">
          <div className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{logs.length}</span> of{' '}
            <span className="font-semibold text-foreground">{meta.total}</span> audit records (Page {meta.page} of {meta.totalPages})
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange({ page: Math.max(1, filters.page - 1) })}
              disabled={filters.page <= 1 || isLoading}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>

            <span className="font-mono text-xs px-2 py-1 bg-muted/40 rounded border">
              {filters.page} / {meta.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange({ page: Math.min(meta.totalPages, filters.page + 1) })}
              disabled={filters.page >= meta.totalPages || isLoading}
              className="h-8 text-xs gap-1"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal Inspector */}
      <AuditLogDetailModal
        log={selectedLog}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};
