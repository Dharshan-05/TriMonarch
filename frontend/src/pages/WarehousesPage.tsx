import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { WarehouseKpiGrid } from '@/features/warehouses/components/WarehouseKpiGrid';
import { WarehouseToolbar } from '@/features/warehouses/components/WarehouseToolbar';
import { WarehouseTable } from '@/features/warehouses/components/WarehouseTable';
import { CreateWarehouseModal } from '@/features/warehouses/components/CreateWarehouseModal';
import { EditWarehouseModal } from '@/features/warehouses/components/EditWarehouseModal';
import { WarehouseDetailModal } from '@/features/warehouses/components/WarehouseDetailModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WarehouseFilterState } from '@/features/warehouses/types/warehouse.types';
import {
  useWarehouseListQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
} from '@/features/warehouses/hooks/useWarehouses';
import { Warehouse, CreateWarehouseInput, UpdateWarehouseInput } from '@/services/warehouses.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const WarehousesPage: React.FC = () => {
  const [filters, setFilters] = useState<WarehouseFilterState>({
    search: '',
    status: 'ALL',
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailWarehouse, setSelectedDetailWarehouse] = useState<Warehouse | null>(null);
  const [selectedEditWarehouse, setSelectedEditWarehouse] = useState<Warehouse | null>(null);

  const queryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: warehousesResponse, isLoading, isError, refetch } = useWarehouseListQuery(queryParams);
  const createWarehouseMutation = useCreateWarehouseMutation();
  const updateWarehouseMutation = useUpdateWarehouseMutation();

  const rawList = warehousesResponse?.data || [];
  const meta = warehousesResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  // Client-side fallback status filtering if backend returns raw list
  const warehouseList = rawList.filter((wh) => {
    if (filters.status === 'ALL') return true;
    return wh.status === filters.status;
  });

  const handleFilterChange = (updated: Partial<WarehouseFilterState>) => {
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

  const handleCreateSubmit = async (data: CreateWarehouseInput) => {
    await createWarehouseMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (id: string, data: UpdateWarehouseInput) => {
    await updateWarehouseMutation.mutateAsync({ id, data });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Warehouse Facilities Management"
        description="Centralized operational hub for physical warehouse locations, storage hubs, and fulfillment parameters."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Facilities
          </Button>
        }
      />

      {/* KPI Grid */}
      <WarehouseKpiGrid warehouses={rawList} totalRecords={meta.total} />

      {/* Toolbar & Filters */}
      <WarehouseToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load warehouse facilities</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve warehouse records from server. Please check network connection or permissions.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Warehouse Table */}
      <WarehouseTable
        warehouses={warehouseList}
        isLoading={isLoading}
        onView={(wh) => setSelectedDetailWarehouse(wh)}
        onEdit={(wh) => setSelectedEditWarehouse(wh)}
      />

      {/* Pagination Controls */}
      {!isLoading && !isError && warehouseList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(meta.page - 1) * meta.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> facilities
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
      <CreateWarehouseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createWarehouseMutation.isPending}
      />

      <EditWarehouseModal
        warehouse={selectedEditWarehouse}
        isOpen={Boolean(selectedEditWarehouse)}
        onClose={() => setSelectedEditWarehouse(null)}
        onSubmit={handleEditSubmit}
        isLoading={updateWarehouseMutation.isPending}
      />

      <WarehouseDetailModal
        warehouse={selectedDetailWarehouse}
        isOpen={Boolean(selectedDetailWarehouse)}
        onClose={() => setSelectedDetailWarehouse(null)}
      />
    </div>
  );
};
