import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PurchaseOrderKpiGrid } from '@/features/purchase-orders/components/PurchaseOrderKpiGrid';
import { PurchaseOrderToolbar } from '@/features/purchase-orders/components/PurchaseOrderToolbar';
import { PurchaseOrderTable } from '@/features/purchase-orders/components/PurchaseOrderTable';
import { CreatePurchaseOrderModal } from '@/features/purchase-orders/components/CreatePurchaseOrderModal';
import { EditPurchaseOrderModal } from '@/features/purchase-orders/components/EditPurchaseOrderModal';
import { PurchaseOrderDetailModal } from '@/features/purchase-orders/components/PurchaseOrderDetailModal';
import { CancelPurchaseOrderModal } from '@/features/purchase-orders/components/CancelPurchaseOrderModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { PurchaseOrderFilterState } from '@/features/purchase-orders/types/purchase-orders.types';
import {
  usePurchaseOrdersListQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useSubmitPurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
} from '@/features/purchase-orders/hooks/usePurchaseOrders';
import {
  PurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from '@/services/purchaseOrders.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const PurchaseOrdersPage: React.FC = () => {
  const [filters, setFilters] = useState<PurchaseOrderFilterState>({
    search: '',
    status: 'ALL',
    page: 1,
    pageSize: 10,
    sortBy: 'order_number',
    sortOrder: 'asc',
  });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<PurchaseOrder | null>(null);
  const [selectedEditOrder, setSelectedEditOrder] = useState<PurchaseOrder | null>(null);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState<PurchaseOrder | null>(null);

  // Queries & Mutations
  const queryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: purchaseOrdersResponse, isLoading, isError, refetch } = usePurchaseOrdersListQuery(queryParams);

  const createMutation = useCreatePurchaseOrderMutation();
  const updateMutation = useUpdatePurchaseOrderMutation();
  const submitMutation = useSubmitPurchaseOrderMutation();
  const approveMutation = useApprovePurchaseOrderMutation();
  const cancelMutation = useCancelPurchaseOrderMutation();
  const deleteMutation = useDeletePurchaseOrderMutation();

  const rawList = purchaseOrdersResponse?.data || [];
  const meta = purchaseOrdersResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  // Fallback client filtering if needed
  const ordersList = rawList.filter((po) => {
    if (filters.status === 'ALL') return true;
    return po.status === filters.status;
  });

  const handleFilterChange = (updated: Partial<PurchaseOrderFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      page: 1,
      pageSize: 10,
      sortBy: 'order_number',
      sortOrder: 'asc',
    });
  };

  const handleCreateSubmit = async (data: CreatePurchaseOrderInput) => {
    await createMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (id: string, data: UpdatePurchaseOrderInput) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleSubmitOrder = async (order: PurchaseOrder) => {
    await submitMutation.mutateAsync(order.id);
  };

  const handleApproveOrder = async (order: PurchaseOrder) => {
    await approveMutation.mutateAsync(order.id);
  };

  const handleCancelSubmit = async (id: string) => {
    await cancelMutation.mutateAsync(id);
  };

  const handleDeleteSubmit = async (order: PurchaseOrder) => {
    if (confirm(`Are you sure you want to delete purchase order ${order.order_number}?`)) {
      await deleteMutation.mutateAsync(order.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Purchase Orders Procurement"
        description="Manage vendor procurement orders, approvals, line items, and supplier fulfillment lifecycles."
      />

      {/* KPI Grid */}
      <PurchaseOrderKpiGrid orders={rawList} totalRecords={meta.total} />

      {/* Toolbar & Filters */}
      <PurchaseOrderToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load purchase orders</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve purchase order pipeline from server. Please check network or permissions.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Purchase Order Table */}
      <PurchaseOrderTable
        orders={ordersList}
        isLoading={isLoading}
        onView={(po) => setSelectedDetailOrder(po)}
        onSubmitOrder={handleSubmitOrder}
        onApproveOrder={handleApproveOrder}
        onEdit={(po) => setSelectedEditOrder(po)}
        onCancel={(po) => setSelectedCancelOrder(po)}
        onDelete={handleDeleteSubmit}
      />

      {/* Pagination Bar */}
      {!isLoading && !isError && ordersList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(meta.page - 1) * meta.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> purchase orders
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
      <CreatePurchaseOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />

      <EditPurchaseOrderModal
        order={selectedEditOrder}
        isOpen={Boolean(selectedEditOrder)}
        onClose={() => setSelectedEditOrder(null)}
        onSubmit={handleEditSubmit}
        isLoading={updateMutation.isPending}
      />

      <PurchaseOrderDetailModal
        order={selectedDetailOrder}
        isOpen={Boolean(selectedDetailOrder)}
        onClose={() => setSelectedDetailOrder(null)}
      />

      <CancelPurchaseOrderModal
        order={selectedCancelOrder}
        isOpen={Boolean(selectedCancelOrder)}
        onClose={() => setSelectedCancelOrder(null)}
        onConfirm={handleCancelSubmit}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
