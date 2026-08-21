import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { UserToolbar } from '@/features/users/components/UserToolbar';
import { UserTable } from '@/features/users/components/UserTable';
import { CreateUserModal } from '@/features/users/components/CreateUserModal';
import { EditUserModal } from '@/features/users/components/EditUserModal';
import { UserDetailModal } from '@/features/users/components/UserDetailModal';
import { ConfirmDeactivateModal } from '@/features/users/components/ConfirmDeactivateModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserFilterState } from '@/features/users/types/users.types';
import {
  useUsersListQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/features/users/hooks/useUsers';
import { User, CreateUserInput, UpdateUserInput } from '@/services/users.service';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [filters, setFilters] = useState<UserFilterState>({
    search: '',
    status: 'ALL',
    role: 'ALL',
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailUser, setSelectedDetailUser] = useState<User | null>(null);
  const [selectedEditUser, setSelectedEditUser] = useState<User | null>(null);
  const [selectedDeactivateUser, setSelectedDeactivateUser] = useState<User | null>(null);

  // Queries & Mutations
  const queryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data: usersResponse, isLoading, isError, refetch } = useUsersListQuery(queryParams);
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const usersList = usersResponse?.data || [];
  const meta = usersResponse?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  const handleFilterChange = (updated: Partial<UserFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      role: 'ALL',
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  const handleCreateSubmit = async (data: CreateUserInput) => {
    await createUserMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (id: string, data: UpdateUserInput) => {
    await updateUserMutation.mutateAsync({ id, data });
  };

  const handleDeactivateConfirm = async (id: string) => {
    await deleteUserMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Users Management"
        description="Manage organization system users, authentication accounts, and access roles."
      />

      {/* Toolbar & Filters */}
      <UserToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Failed to load user accounts</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>Unable to retrieve user records from server. Please check permissions or try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-7 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* User Table */}
      <UserTable
        users={usersList}
        isLoading={isLoading}
        onView={(u) => setSelectedDetailUser(u)}
        onEdit={(u) => setSelectedEditUser(u)}
        onDeactivate={(u) => setSelectedDeactivateUser(u)}
      />

      {/* Pagination Bar */}
      {!isLoading && !isError && usersList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(meta.page - 1) * meta.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> users
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
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createUserMutation.isPending}
      />

      <EditUserModal
        user={selectedEditUser}
        isOpen={Boolean(selectedEditUser)}
        onClose={() => setSelectedEditUser(null)}
        onSubmit={handleEditSubmit}
        isLoading={updateUserMutation.isPending}
      />

      <UserDetailModal
        user={selectedDetailUser}
        isOpen={Boolean(selectedDetailUser)}
        onClose={() => setSelectedDetailUser(null)}
      />

      <ConfirmDeactivateModal
        user={selectedDeactivateUser}
        isOpen={Boolean(selectedDeactivateUser)}
        onClose={() => setSelectedDeactivateUser(null)}
        onConfirm={handleDeactivateConfirm}
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  );
};
