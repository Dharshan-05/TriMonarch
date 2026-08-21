import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PartnerToolbar } from '@/features/partners/components/PartnerToolbar';
import { PartnerTable } from '@/features/partners/components/PartnerTable';
import { CreatePartnerModal } from '@/features/partners/components/CreatePartnerModal';
import { EditPartnerModal } from '@/features/partners/components/EditPartnerModal';
import { PartnerDetailModal } from '@/features/partners/components/PartnerDetailModal';
import { ConfirmDeletePartnerModal } from '@/features/partners/components/ConfirmDeletePartnerModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { PartnerFilterState } from '@/features/partners/types/partners.types';
import {
  usePartnersListQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,
} from '@/features/partners/hooks/usePartners';
import { Partner, CreatePartnerInput, UpdatePartnerInput, PartnerType } from '@/services/partners.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const PartnersPage: React.FC = () => {
  const [filters, setFilters] = useState<PartnerFilterState>({
    search: '',
    type: 'ALL',
    status: 'ALL',
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailPartner, setSelectedDetailPartner] = useState<Partner | null>(null);
  const [selectedEditPartner, setSelectedEditPartner] = useState<Partner | null>(null);
  const [selectedDeletePartner, setSelectedDeletePartner] = useState<Partner | null>(null);

  // Queries & Mutations
  const queryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    type: filters.type !== 'ALL' ? filters.type : undefined,
    search: filters.search || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: partnersResponse, isLoading, isError, refetch } = usePartnersListQuery(queryParams);
  const createPartnerMutation = useCreatePartnerMutation();
  const updatePartnerMutation = useUpdatePartnerMutation();
  const deletePartnerMutation = useDeletePartnerMutation();

  const partnersList = partnersResponse?.data || [];
  const meta = partnersResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  const handleFilterChange = (updated: Partial<PartnerFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'ALL',
      status: 'ALL',
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  const handleCreateSubmit = async (data: CreatePartnerInput) => {
    await createPartnerMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (id: string, data: UpdatePartnerInput) => {
    await updatePartnerMutation.mutateAsync({ id, data });
  };

  const handleDeleteConfirm = async (id: string, type: PartnerType) => {
    await deletePartnerMutation.mutateAsync({ id, type });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Business Partners"
        description="Manage customers, suppliers, and external organization master data."
      />

      {/* Toolbar & Filters */}
      <PartnerToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load business partners</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve partner records from server. Please check permissions or try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Partner Table */}
      <PartnerTable
        partners={partnersList}
        isLoading={isLoading}
        onView={(p) => setSelectedDetailPartner(p)}
        onEdit={(p) => setSelectedEditPartner(p)}
        onDelete={(p) => setSelectedDeletePartner(p)}
      />

      {/* Pagination Bar */}
      {!isLoading && !isError && partnersList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(meta.page - 1) * meta.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> partners
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
      <CreatePartnerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createPartnerMutation.isPending}
      />

      <EditPartnerModal
        partner={selectedEditPartner}
        isOpen={Boolean(selectedEditPartner)}
        onClose={() => setSelectedEditPartner(null)}
        onSubmit={handleEditSubmit}
        isLoading={updatePartnerMutation.isPending}
      />

      <PartnerDetailModal
        partner={selectedDetailPartner}
        isOpen={Boolean(selectedDetailPartner)}
        onClose={() => setSelectedDetailPartner(null)}
      />

      <ConfirmDeletePartnerModal
        partner={selectedDeletePartner}
        isOpen={Boolean(selectedDeletePartner)}
        onClose={() => setSelectedDeletePartner(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deletePartnerMutation.isPending}
      />
    </div>
  );
};
