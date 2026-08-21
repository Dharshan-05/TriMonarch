import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { SalesDeliveryKpiGrid } from '@/features/sales-deliveries/components/SalesDeliveryKpiGrid';
import { SalesDeliveryToolbar } from '@/features/sales-deliveries/components/SalesDeliveryToolbar';
import { SalesDeliveryTable } from '@/features/sales-deliveries/components/SalesDeliveryTable';
import { CreateSalesDeliveryModal } from '@/features/sales-deliveries/components/CreateSalesDeliveryModal';
import { SalesDeliveryDetailModal } from '@/features/sales-deliveries/components/SalesDeliveryDetailModal';
import { CancelSalesDeliveryModal } from '@/features/sales-deliveries/components/CancelSalesDeliveryModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SalesDeliveryFilterState } from '@/features/sales-deliveries/types/sales-deliveries.types';
import {
  useSalesDeliveriesListQuery,
  useCreateSalesDeliveryMutation,
  useConfirmSalesDeliveryMutation,
  useStartPickingMutation,
  useMarkPackedMutation,
  useShipSalesDeliveryMutation,
  useDeliverSalesDeliveryMutation,
  useCancelSalesDeliveryMutation,
} from '@/features/sales-deliveries/hooks/useSalesDeliveries';
import {
  SalesDelivery,
  SalesDeliveryStatus,
  CreateSalesDeliveryInput,
} from '@/services/salesDeliveries.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const SalesDeliveriesPage: React.FC = () => {
  const [filters, setFilters] = useState<SalesDeliveryFilterState>({
    search: '',
    status: 'ALL',
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailDelivery, setSelectedDetailDelivery] = useState<SalesDelivery | null>(null);
  const [selectedCancelDelivery, setSelectedCancelDelivery] = useState<SalesDelivery | null>(null);

  // Queries & Mutations
  const queryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: deliveriesResponse, isLoading, isError, refetch } = useSalesDeliveriesListQuery(queryParams);

  const createMutation = useCreateSalesDeliveryMutation();
  const confirmMutation = useConfirmSalesDeliveryMutation();
  const pickingMutation = useStartPickingMutation();
  const packedMutation = useMarkPackedMutation();
  const shipMutation = useShipSalesDeliveryMutation();
  const deliverMutation = useDeliverSalesDeliveryMutation();
  const cancelMutation = useCancelSalesDeliveryMutation();

  const rawList = deliveriesResponse?.data || [];
  const meta = deliveriesResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  // Fallback client filtering if needed
  const deliveriesList = rawList.filter((d) => {
    if (filters.status === 'ALL') return true;
    return d.status === filters.status;
  });

  const handleFilterChange = (updated: Partial<SalesDeliveryFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      page: 1,
      pageSize: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const handleCreateSubmit = async (data: CreateSalesDeliveryInput) => {
    await createMutation.mutateAsync(data);
  };

  const handleTransitionSubmit = async (delivery: SalesDelivery, targetStatus: SalesDeliveryStatus) => {
    try {
      switch (targetStatus) {
        case 'confirmed':
          await confirmMutation.mutateAsync(delivery.id);
          break;
        case 'picking':
          await pickingMutation.mutateAsync(delivery.id);
          break;
        case 'packed':
          await packedMutation.mutateAsync(delivery.id);
          break;
        case 'shipped':
          await shipMutation.mutateAsync(delivery.id);
          break;
        case 'delivered':
          await deliverMutation.mutateAsync(delivery.id);
          break;
      }
    } catch (err: unknown) {
      console.error('Failed state transition:', err);
    }
  };

  const handleCancelSubmit = async (id: string) => {
    await cancelMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Sales Delivery Dispatch"
        description="Track operational warehouse fulfillment, picking, packing, shipping, and delivery milestones."
      />

      {/* KPI Grid */}
      <SalesDeliveryKpiGrid deliveries={rawList} totalRecords={meta.total} />

      {/* Toolbar & Filters */}
      <SalesDeliveryToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load sales deliveries</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve delivery dispatch list from server. Please verify network or permissions.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Sales Delivery Table */}
      <SalesDeliveryTable
        deliveries={deliveriesList}
        isLoading={isLoading}
        onView={(del) => setSelectedDetailDelivery(del)}
        onTransition={handleTransitionSubmit}
        onCancel={(del) => setSelectedCancelDelivery(del)}
      />

      {/* Pagination Bar */}
      {!isLoading && !isError && deliveriesList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(meta.page - 1) * meta.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> delivery dispatches
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
      <CreateSalesDeliveryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />

      <SalesDeliveryDetailModal
        delivery={selectedDetailDelivery}
        isOpen={Boolean(selectedDetailDelivery)}
        onClose={() => setSelectedDetailDelivery(null)}
      />

      <CancelSalesDeliveryModal
        delivery={selectedCancelDelivery}
        isOpen={Boolean(selectedCancelDelivery)}
        onClose={() => setSelectedCancelDelivery(null)}
        onConfirm={handleCancelSubmit}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
