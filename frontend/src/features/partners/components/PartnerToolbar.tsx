import React from 'react';
import { SearchInput, FilterBar } from '@/components/ui/search-and-filter';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PartnerFilterState, PARTNER_TYPE_OPTIONS, PARTNER_STATUS_OPTIONS } from '../types/partners.types';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';

interface PartnerToolbarProps {
  filters: PartnerFilterState;
  onFilterChange: (updated: Partial<PartnerFilterState>) => void;
  onResetFilters: () => void;
  onCreateClick: () => void;
}

export const PartnerToolbar: React.FC<PartnerToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onCreateClick,
}) => {
  const { hasPermission } = useAuthorization();
  const canCreate = hasPermission('partner:create');

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.type !== 'ALL' ? 1 : 0) +
    (filters.status !== 'ALL' ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <FilterBar activeFiltersCount={activeFiltersCount} onClearFilters={onResetFilters}>
        <SearchInput
          placeholder="Search by company or email..."
          value={filters.search}
          onSearchChange={(val) => onFilterChange({ search: val, page: 1 })}
          className="max-w-xs"
        />

        <div className="w-40">
          <Select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value as PartnerFilterState['type'], page: 1 })}
            className="h-9 text-xs py-1"
          >
            <option value="ALL">All Partner Types</option>
            {PARTNER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as PartnerFilterState['status'], page: 1 })}
            className="h-9 text-xs py-1"
          >
            <option value="ALL">All Statuses</option>
            {PARTNER_STATUS_OPTIONS.map((opt) => (
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
            <Plus className="h-4 w-4" /> Create Partner
          </Button>
        </div>
      )}
    </div>
  );
};
