import React from 'react';
import { SearchInput, FilterBar } from '@/components/ui/search-and-filter';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProductFilterState, PRODUCT_STATUS_OPTIONS, COMMON_PRODUCT_CATEGORIES } from '../types/products.types';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';

interface ProductToolbarProps {
  filters: ProductFilterState;
  onFilterChange: (updated: Partial<ProductFilterState>) => void;
  onResetFilters: () => void;
  onCreateClick: () => void;
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onCreateClick,
}) => {
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('product:write');

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.status !== 'ALL' ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <FilterBar activeFiltersCount={activeFiltersCount} onClearFilters={onResetFilters}>
        <SearchInput
          placeholder="Search by product name or SKU..."
          value={filters.search}
          onSearchChange={(val) => onFilterChange({ search: val, page: 1 })}
          className="max-w-xs"
        />

        <div className="w-44">
          <Select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
            className="h-9 text-xs py-1"
          >
            <option value="">All Categories</option>
            {COMMON_PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as ProductFilterState['status'], page: 1 })}
            className="h-9 text-xs py-1"
          >
            <option value="ALL">All Statuses</option>
            {PRODUCT_STATUS_OPTIONS.map((opt) => (
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
            <Plus className="h-4 w-4" /> Create Product
          </Button>
        </div>
      )}
    </div>
  );
};
