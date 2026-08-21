import React from 'react';
import { SearchInput, FilterBar } from '@/components/ui/search-and-filter';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { InventoryFilterState, STOCK_STATUS_FILTER_OPTIONS } from '../types/inventory.types';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';

interface InventoryToolbarProps {
  filters: InventoryFilterState;
  onFilterChange: (updated: Partial<InventoryFilterState>) => void;
  onResetFilters: () => void;
  onCreateClick: () => void;
}

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onCreateClick,
}) => {
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('inventory:write');

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.stockFilter !== 'ALL' ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <FilterBar activeFiltersCount={activeFiltersCount} onClearFilters={onResetFilters}>
        <SearchInput
          placeholder="Search by SKU or product..."
          value={filters.search}
          onSearchChange={(val) => onFilterChange({ search: val, page: 1 })}
          className="max-w-xs"
        />

        <div className="w-44">
          <Select
            value={filters.stockFilter}
            onChange={(e) =>
              onFilterChange({ stockFilter: e.target.value as InventoryFilterState['stockFilter'], page: 1 })
            }
            className="h-9 text-xs py-1"
          >
            {STOCK_STATUS_FILTER_OPTIONS.map((opt) => (
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
            <Plus className="h-4 w-4" /> Create Stock Entry
          </Button>
        </div>
      )}
    </div>
  );
};
