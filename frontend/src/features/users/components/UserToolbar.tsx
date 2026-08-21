import React from 'react';
import { SearchInput, FilterBar } from '@/components/ui/search-and-filter';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UserFilterState, USER_STATUS_OPTIONS, SYSTEM_ROLE_OPTIONS } from '../types/users.types';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';

interface UserToolbarProps {
  filters: UserFilterState;
  onFilterChange: (updated: Partial<UserFilterState>) => void;
  onResetFilters: () => void;
  onCreateClick: () => void;
}

export const UserToolbar: React.FC<UserToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onCreateClick,
}) => {
  const { hasPermission } = useAuthorization();
  const canCreate = hasPermission('user:create');

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.status !== 'ALL' ? 1 : 0) +
    (filters.role !== 'ALL' ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <FilterBar activeFiltersCount={activeFiltersCount} onClearFilters={onResetFilters}>
        <SearchInput
          placeholder="Search by name or email..."
          value={filters.search}
          onSearchChange={(val) => onFilterChange({ search: val, page: 1 })}
          className="max-w-xs"
        />

        <div className="w-40">
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as UserFilterState['status'], page: 1 })}
            className="h-9 text-xs py-1"
          >
            <option value="ALL">All Statuses</option>
            {USER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-44">
          <Select
            value={filters.role}
            onChange={(e) => onFilterChange({ role: e.target.value, page: 1 })}
            className="h-9 text-xs py-1"
          >
            <option value="ALL">All Roles</option>
            {SYSTEM_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={onCreateClick} size="sm" className="gap-2 text-xs font-semibold">
            <Plus className="h-4 w-4" /> Create User
          </Button>
        </div>
      )}
    </div>
  );
};
