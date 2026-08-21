import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PurchaseReceiptKpiGrid } from '@/features/purchase-receipts/components/PurchaseReceiptKpiGrid';
import { PurchaseReceiptToolbar } from '@/features/purchase-receipts/components/PurchaseReceiptToolbar';
import { PurchaseReceiptTable } from '@/features/purchase-receipts/components/PurchaseReceiptTable';
import { CreatePurchaseReceiptModal } from '@/features/purchase-receipts/components/CreatePurchaseReceiptModal';
import { PurchaseReceiptDetailModal } from '@/features/purchase-receipts/components/PurchaseReceiptDetailModal';
import { CancelPurchaseReceiptModal } from '@/features/purchase-receipts/components/CancelPurchaseReceiptModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { PurchaseReceiptFilterState } from '@/features/purchase-receipts/types/purchase-receipts.types';
import {
  usePurchaseReceiptsListQuery,
  useCreatePurchaseReceiptMutation,
  usePostPurchaseReceiptMutation,
  useCompletePurchaseReceiptMutation,
  useCancelPurchaseReceiptMutation,
} from '@/features/purchase-receipts/hooks/usePurchaseReceipts';
import { PurchaseReceipt, CreatePurchaseReceiptInput } from '@/services/purchaseReceipts.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const PurchaseReceiptsPage: React.FC = () => {
  const [filters, setFilters] = useState<PurchaseReceiptFilterState>({
    query: '',
    status: 'ALL',
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailReceipt, setSelectedDetailReceipt] = useState<PurchaseReceipt | null>(null);
  const [selectedCancelReceipt, setSelectedCancelReceipt] = useState<PurchaseReceipt | null>(null);

  // Queries & Mutations
  const queryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    query: filters.query || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: receiptsResponse, isLoading, isError, refetch } = usePurchaseReceiptsListQuery(queryParams);

  const createMutation = useCreatePurchaseReceiptMutation();
  const postMutation = usePostPurchaseReceiptMutation();
  const completeMutation = useCompletePurchaseReceiptMutation();
  const cancelMutation = useCancelPurchaseReceiptMutation();

  const rawList = receiptsResponse?.data || [];
  const meta = receiptsResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  // Fallback client filtering
  const receiptsList = rawList.filter((r) => {
    if (filters.status === 'ALL') return true;
    return r.status === filters.status;
  });

  const handleFilterChange = (updated: Partial<PurchaseReceiptFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      status: 'ALL',
      page: 1,
      pageSize: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const handleCreateSubmit = async (data: CreatePurchaseReceiptInput) => {
    await createMutation.mutateAsync(data);
  };

  const handlePostReceipt = async (receipt: PurchaseReceipt) => {
    await postMutation.mutateAsync(receipt.id);
  };

  const handleCompleteReceipt = async (receipt: PurchaseReceipt) => {
    await completeMutation.mutateAsync(receipt.id);
  };

  const handleCancelSubmit = async (id: string) => {
    await cancelMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Purchase Goods Receipts"
        description="Manage warehouse goods receiving dispatches, stock ledger postings, and purchase order fulfillment."
      />

      {/* KPI Grid */}
      <PurchaseReceiptKpiGrid receipts={rawList} totalRecords={meta.total} />

      {/* Toolbar & Filters */}
      <PurchaseReceiptToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load goods receipts</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve purchase receipts pipeline from server. Please check network or permissions.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Receipt Table */}
      <PurchaseReceiptTable
        receipts={receiptsList}
        isLoading={isLoading}
        onView={(r) => setSelectedDetailReceipt(r)}
        onPostReceipt={handlePostReceipt}
        onCompleteReceipt={handleCompleteReceipt}
        onCancelReceipt={(r) => setSelectedCancelReceipt(r)}
      />

      {/* Pagination Bar */}
      {!isLoading && !isError && receiptsList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(meta.page - 1) * meta.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> goods receipts
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

      {/* Modals */}
      <CreatePurchaseReceiptModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />

      <PurchaseReceiptDetailModal
        receipt={selectedDetailReceipt}
        isOpen={Boolean(selectedDetailReceipt)}
        onClose={() => setSelectedDetailReceipt(null)}
      />

      <CancelPurchaseReceiptModal
        receipt={selectedCancelReceipt}
        isOpen={Boolean(selectedCancelReceipt)}
        onClose={() => setSelectedCancelReceipt(null)}
        onConfirm={handleCancelSubmit}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
