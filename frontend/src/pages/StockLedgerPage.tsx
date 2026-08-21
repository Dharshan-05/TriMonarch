import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { StockLedgerKpiGrid } from '@/features/stock-ledger/components/StockLedgerKpiGrid';
import { StockLedgerToolbar } from '@/features/stock-ledger/components/StockLedgerToolbar';
import { StockLedgerTable } from '@/features/stock-ledger/components/StockLedgerTable';
import { StockLedgerDetailModal } from '@/features/stock-ledger/components/StockLedgerDetailModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { StockLedgerFilterState } from '@/features/stock-ledger/types/stock-ledger.types';
import { useStockLedgerQuery } from '@/features/stock-ledger/hooks/useStockLedger';
import { StockLedgerEntry } from '@/services/stockLedger.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const StockLedgerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const inventoryIdParam = searchParams.get('inventoryId') || undefined;

  const [filters, setFilters] = useState<StockLedgerFilterState>({
    inventoryId: inventoryIdParam,
    movementType: 'ALL',
    search: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const [selectedEntry, setSelectedEntry] = useState<StockLedgerEntry | null>(null);

  // Sync inventoryId from searchParams if updated
  const activeInventoryId = inventoryIdParam || filters.inventoryId;

  const queryParams = {
    inventoryId: activeInventoryId,
    movementType: filters.movementType !== 'ALL' ? filters.movementType : undefined,
    search: filters.search || undefined,
    page: filters.page,
    pageSize: filters.pageSize,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: ledgerResponse, isLoading, isError, refetch } = useStockLedgerQuery(queryParams);

  const rawList = ledgerResponse?.data || [];
  const meta = ledgerResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  // Client-side movement filter fallback if backend returns unfiltered array
  const ledgerEntries = rawList.filter((item) => {
    if (filters.movementType === 'ALL') return true;
    return item.movement_type === filters.movementType;
  });

  const handleFilterChange = (updated: Partial<StockLedgerFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setSearchParams({});
    setFilters({
      inventoryId: undefined,
      movementType: 'ALL',
      search: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const handleClearInventoryFilter = () => {
    const updatedParams = new URLSearchParams(searchParams);
    updatedParams.delete('inventoryId');
    setSearchParams(updatedParams);
    setFilters((prev) => ({ ...prev, inventoryId: undefined, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Stock Ledger Audit Trail"
        description="Auditable history and traceability of stock movement transactions across all locations."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Audit Trail
          </Button>
        }
      />

      {/* KPI Grid */}
      <StockLedgerKpiGrid entries={rawList} totalRecords={meta.total} />

      {/* Toolbar & Filters */}
      <StockLedgerToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        activeInventoryId={activeInventoryId}
        onClearInventoryFilter={handleClearInventoryFilter}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load stock ledger</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve audit history from server. Please verify permissions or network.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Ledger Table */}
      <StockLedgerTable
        entries={ledgerEntries}
        isLoading={isLoading}
        onViewDetail={(entry) => setSelectedEntry(entry)}
      />

      {/* Pagination Controls */}
      {!isLoading && !isError && ledgerEntries.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(meta.page - 1) * meta.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> audit records
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange({ page: Math.max(filters.page - 1, 1) })}
              disabled={filters.page <= 1}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="text-xs font-mono px-2">
              Page {meta.page} of {meta.totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange({ page: Math.min(filters.page + 1, meta.totalPages || 1) })}
              disabled={filters.page >= (meta.totalPages || 1)}
              className="h-8 gap-1 text-xs"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      <StockLedgerDetailModal
        entry={selectedEntry}
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
};
