import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { SalesOrderKpiGrid } from '@/features/sales-orders/components/SalesOrderKpiGrid';
import { SalesOrderToolbar } from '@/features/sales-orders/components/SalesOrderToolbar';
import { SalesOrderTable } from '@/features/sales-orders/components/SalesOrderTable';
import { CreateSalesOrderModal } from '@/features/sales-orders/components/CreateSalesOrderModal';
import { EditSalesOrderModal } from '@/features/sales-orders/components/EditSalesOrderModal';
import { SalesOrderDetailModal } from '@/features/sales-orders/components/SalesOrderDetailModal';
import { ConfirmSalesOrderModal } from '@/features/sales-orders/components/ConfirmSalesOrderModal';
import { CancelSalesOrderModal } from '@/features/sales-orders/components/CancelSalesOrderModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SalesOrderFilterState } from '@/features/sales-orders/types/sales-orders.types';
import {
  useSalesOrdersListQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useUpdateSalesOrderStatusMutation,
  useDeleteSalesOrderMutation,
} from '@/features/sales-orders/hooks/useSalesOrders';
import {
  SalesOrder,
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
} from '@/services/salesOrders.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const SalesOrdersPage: React.FC = () => {
  const [filters, setFilters] = useState<SalesOrderFilterState>({
    search: '',
    status: 'ALL',
    page: 1,
    pageSize: 10,
    sortBy: 'order_number',
    sortOrder: 'asc',
  });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<SalesOrder | null>(null);
  const [selectedEditOrder, setSelectedEditOrder] = useState<SalesOrder | null>(null);
  const [selectedConfirmOrder, setSelectedConfirmOrder] = useState<SalesOrder | null>(null);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState<SalesOrder | null>(null);

  // Queries & Mutations
  const queryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: salesOrdersResponse, isLoading, isError, refetch } = useSalesOrdersListQuery(queryParams);
  const createMutation = useCreateSalesOrderMutation();
  const updateMutation = useUpdateSalesOrderMutation();
  const updateStatusMutation = useUpdateSalesOrderStatusMutation();
  const deleteMutation = useDeleteSalesOrderMutation();

  const rawList = salesOrdersResponse?.data || [];
  const meta = salesOrdersResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  // Fallback client filtering if backend returns unfiltered array
  const ordersList = rawList.filter((ord) => {
    if (filters.status === 'ALL') return true;
    return ord.status === filters.status;
  });

  const handleFilterChange = (updated: Partial<SalesOrderFilterState>) => {
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

  const handleCreateSubmit = async (data: CreateSalesOrderInput) => {
    await createMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (id: string, data: UpdateSalesOrderInput) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleConfirmSubmit = async (id: string) => {
    await updateStatusMutation.mutateAsync({ id, status: 'confirmed' });
  };

  const handleCancelSubmit = async (id: string) => {
    await updateStatusMutation.mutateAsync({ id, status: 'cancelled' });
  };

  const handleDeleteSubmit = async (order: SalesOrder) => {
    if (confirm(`Are you sure you want to delete sales order ${order.order_number}?`)) {
      await deleteMutation.mutateAsync(order.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Sales Orders Pipeline"
        description="Manage customer orders, status fulfillment lifecycles, and financial line items."
      />

      {/* KPI Grid */}
      <SalesOrderKpiGrid orders={rawList} totalRecords={meta.total} />

      {/* Toolbar & Filters */}
      <SalesOrderToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load sales orders</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve sales order pipeline from server. Please verify permissions or network.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Sales Order Table */}
      <SalesOrderTable
        orders={ordersList}
        isLoading={isLoading}
        onView={(ord) => setSelectedDetailOrder(ord)}
        onConfirm={(ord) => setSelectedConfirmOrder(ord)}
        onEdit={(ord) => setSelectedEditOrder(ord)}
        onCancel={(ord) => setSelectedCancelOrder(ord)}
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
            of <span className="font-semibold text-foreground">{meta.total}</span> sales orders
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
      <CreateSalesOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />

      <EditSalesOrderModal
        order={selectedEditOrder}
        isOpen={Boolean(selectedEditOrder)}
        onClose={() => setSelectedEditOrder(null)}
        onSubmit={handleEditSubmit}
        isLoading={updateMutation.isPending}
      />

      <SalesOrderDetailModal
        order={selectedDetailOrder}
        isOpen={Boolean(selectedDetailOrder)}
        onClose={() => setSelectedDetailOrder(null)}
      />

      <ConfirmSalesOrderModal
        order={selectedConfirmOrder}
        isOpen={Boolean(selectedConfirmOrder)}
        onClose={() => setSelectedConfirmOrder(null)}
        onConfirm={handleConfirmSubmit}
        isLoading={updateStatusMutation.isPending}
      />

      <CancelSalesOrderModal
        order={selectedCancelOrder}
        isOpen={Boolean(selectedCancelOrder)}
        onClose={() => setSelectedCancelOrder(null)}
        onConfirm={handleCancelSubmit}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
};
