import React from 'react';
import { SearchInput, FilterBar } from '@/components/ui/search-and-filter';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PurchaseReceiptFilterState, PURCHASE_RECEIPT_STATUS_OPTIONS } from '../types/purchase-receipts.types';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';

interface PurchaseReceiptToolbarProps {
  filters: PurchaseReceiptFilterState;
  onFilterChange: (updated: Partial<PurchaseReceiptFilterState>) => void;
  onResetFilters: () => void;
  onCreateClick: () => void;
}

export const PurchaseReceiptToolbar: React.FC<PurchaseReceiptToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onCreateClick,
}) => {
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('purchase_order:write');

  const activeFiltersCount =
    (filters.query ? 1 : 0) +
    (filters.status !== 'ALL' ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <FilterBar activeFiltersCount={activeFiltersCount} onClearFilters={onResetFilters}>
        <SearchInput
          placeholder="Search by receipt # or PO..."
          value={filters.query}
          onSearchChange={(val) => onFilterChange({ query: val, page: 1 })}
          className="max-w-xs"
        />

        <div className="w-52">
          <Select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ status: e.target.value as PurchaseReceiptFilterState['status'], page: 1 })
            }
            className="h-9 text-xs py-1"
          >
            {PURCHASE_RECEIPT_STATUS_OPTIONS.map((opt) => (
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
            <Plus className="h-4 w-4" /> Receive PO Goods
          </Button>
        </div>
      )}
    </div>
  );
};
