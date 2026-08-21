import React from 'react';
import { SearchInput, FilterBar } from '@/components/ui/search-and-filter';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StockLedgerFilterState, MOVEMENT_TYPE_OPTIONS } from '../types/stock-ledger.types';
import { X, Filter } from 'lucide-react';

interface StockLedgerToolbarProps {
  filters: StockLedgerFilterState;
  onFilterChange: (updated: Partial<StockLedgerFilterState>) => void;
  onResetFilters: () => void;
  activeInventoryId?: string;
  onClearInventoryFilter?: () => void;
}

export const StockLedgerToolbar: React.FC<StockLedgerToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  activeInventoryId,
  onClearInventoryFilter,
}) => {
  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.movementType !== 'ALL' ? 1 : 0) +
    (activeInventoryId ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <FilterBar activeFiltersCount={activeFiltersCount} onClearFilters={onResetFilters}>
        <SearchInput
          placeholder="Search by notes or reference ID..."
          value={filters.search}
          onSearchChange={(val) => onFilterChange({ search: val, page: 1 })}
          className="max-w-xs"
        />

        <div className="w-48">
          <Select
            value={filters.movementType}
            onChange={(e) => onFilterChange({ movementType: e.target.value, page: 1 })}
            className="h-9 text-xs py-1"
          >
            {MOVEMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      {activeInventoryId && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20 text-xs">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Filtered by Inventory Record ID:</span>
          <Badge variant="outline" className="font-mono text-[10px] bg-background">
            {activeInventoryId}
          </Badge>
          {onClearInventoryFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearInventoryFilter}
              className="h-5 px-1.5 ml-auto text-[10px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" /> Clear Inventory Context
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
