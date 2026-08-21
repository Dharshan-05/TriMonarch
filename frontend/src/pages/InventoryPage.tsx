import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { InventoryKpiGrid } from '@/features/inventory/components/InventoryKpiGrid';
import { InventoryToolbar } from '@/features/inventory/components/InventoryToolbar';
import { InventoryTable } from '@/features/inventory/components/InventoryTable';
import { CreateInventoryModal } from '@/features/inventory/components/CreateInventoryModal';
import { AdjustStockModal } from '@/features/inventory/components/AdjustStockModal';
import { EditInventoryModal } from '@/features/inventory/components/EditInventoryModal';
import { InventoryDetailModal } from '@/features/inventory/components/InventoryDetailModal';
import { ConfirmDeleteInventoryModal } from '@/features/inventory/components/ConfirmDeleteInventoryModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InventoryFilterState } from '@/features/inventory/types/inventory.types';
import {
  useInventoryListQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useAdjustStockMutation,
  useDeleteInventoryMutation,
} from '@/features/inventory/hooks/useInventory';
import {
  Inventory,
  CreateInventoryInput,
  UpdateInventoryInput,
  AdjustInventoryInput,
} from '@/services/inventory.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [filters, setFilters] = useState<InventoryFilterState>({
    search: '',
    stockFilter: 'ALL',
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<Inventory | null>(null);
  const [selectedAdjustItem, setSelectedAdjustItem] = useState<Inventory | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<Inventory | null>(null);
  const [selectedDeleteItem, setSelectedDeleteItem] = useState<Inventory | null>(null);

  // Queries & Mutations
  const queryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    status: filters.stockFilter !== 'ALL' ? filters.stockFilter : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: inventoryResponse, isLoading, isError, refetch } = useInventoryListQuery(queryParams);
  const createInventoryMutation = useCreateInventoryMutation();
  const updateInventoryMutation = useUpdateInventoryMutation();
  const adjustStockMutation = useAdjustStockMutation();
  const deleteInventoryMutation = useDeleteInventoryMutation();

  const rawList = inventoryResponse?.data || [];
  const meta = inventoryResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  // Local filtering based on stock filter if backend passes raw inventory
  const inventoryList = rawList.filter((item) => {
    if (filters.stockFilter === 'ALL') return true;
    const qty = parseFloat(item.quantity || '0');
    const reorder = parseFloat(item.reorder_level || '0');

    if (filters.stockFilter === 'OUT_OF_STOCK') return qty <= 0;
    if (filters.stockFilter === 'LOW_STOCK') return qty > 0 && reorder > 0 && qty <= reorder;
    if (filters.stockFilter === 'IN_STOCK') return qty > (reorder > 0 ? reorder : 0);
    return true;
  });

  const handleFilterChange = (updated: Partial<InventoryFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      stockFilter: 'ALL',
      page: 1,
      pageSize: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const handleCreateSubmit = async (data: CreateInventoryInput) => {
    await createInventoryMutation.mutateAsync(data);
  };

  const handleAdjustSubmit = async (id: string, data: AdjustInventoryInput) => {
    await adjustStockMutation.mutateAsync({ id, data });
  };

  const handleEditSubmit = async (id: string, data: UpdateInventoryInput) => {
    await updateInventoryMutation.mutateAsync({ id, data });
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteInventoryMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inventory & Stock State"
        description="Monitor current stock levels, location availability, and reorder thresholds."
      />

      {/* KPI Grid */}
      <InventoryKpiGrid inventoryList={rawList} totalRecords={meta.total} />

      {/* Toolbar & Filters */}
      <InventoryToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load inventory records</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve stock data from server. Please check permissions or try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Table */}
      <InventoryTable
        inventory={inventoryList}
        isLoading={isLoading}
        onView={(item) => setSelectedDetailItem(item)}
        onAdjust={(item) => setSelectedAdjustItem(item)}
        onEdit={(item) => setSelectedEditItem(item)}
        onDelete={(item) => setSelectedDeleteItem(item)}
      />

      {/* Pagination Bar */}
      {!isLoading && !isError && inventoryList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(meta.page - 1) * meta.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> stock entries
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
      <CreateInventoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createInventoryMutation.isPending}
      />

      <AdjustStockModal
        item={selectedAdjustItem}
        isOpen={Boolean(selectedAdjustItem)}
        onClose={() => setSelectedAdjustItem(null)}
        onSubmit={handleAdjustSubmit}
        isLoading={adjustStockMutation.isPending}
      />

      <EditInventoryModal
        item={selectedEditItem}
        isOpen={Boolean(selectedEditItem)}
        onClose={() => setSelectedEditItem(null)}
        onSubmit={handleEditSubmit}
        isLoading={updateInventoryMutation.isPending}
      />

      <InventoryDetailModal
        item={selectedDetailItem}
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
      />

      <ConfirmDeleteInventoryModal
        item={selectedDeleteItem}
        isOpen={Boolean(selectedDeleteItem)}
        onClose={() => setSelectedDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteInventoryMutation.isPending}
      />
    </div>
  );
};
