import React from 'react';
import { SearchInput, FilterBar } from '@/components/ui/search-and-filter';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SalesOrderFilterState, SALES_ORDER_STATUS_OPTIONS } from '../types/sales-orders.types';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';

interface SalesOrderToolbarProps {
  filters: SalesOrderFilterState;
  onFilterChange: (updated: Partial<SalesOrderFilterState>) => void;
  onResetFilters: () => void;
  onCreateClick: () => void;
}

export const SalesOrderToolbar: React.FC<SalesOrderToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onCreateClick,
}) => {
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('sales_order:write');

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.status !== 'ALL' ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <FilterBar activeFiltersCount={activeFiltersCount} onClearFilters={onResetFilters}>
        <SearchInput
          placeholder="Search by order # or customer..."
          value={filters.search}
          onSearchChange={(val) => onFilterChange({ search: val, page: 1 })}
          className="max-w-xs"
        />

        <div className="w-44">
          <Select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ status: e.target.value as SalesOrderFilterState['status'], page: 1 })
            }
            className="h-9 text-xs py-1"
          >
            {SALES_ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      {canWrite && (
        <div className="flex justify-end">
          <Button onClick={onCreateClick} size="sm" className="gap-2 text-xs font-semibold">
            <Plus className="h-4 w-4" /> Create Sales Order
          </Button>
        </div>
      )}
    </div>
  );
};
