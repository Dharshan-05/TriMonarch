import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { WarehouseFilterState } from '../types/warehouse.types';
import { Search, Plus, RotateCcw } from 'lucide-react';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';

interface WarehouseToolbarProps {
  filters: WarehouseFilterState;
  onFilterChange: (updated: Partial<WarehouseFilterState>) => void;
  onResetFilters: () => void;
  onCreateClick: () => void;
}

export const WarehouseToolbar: React.FC<WarehouseToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onCreateClick,
}) => {
  const { hasPermission } = useAuthorization();
  const canCreate = hasPermission('inventory:write');

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card shadow-subtle">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search code, facility name, or location..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="pl-9 text-xs h-9"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-[160px]">
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as WarehouseFilterState['status'], page: 1 })}
            className="text-xs h-9"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Facilities</option>
            <option value="inactive">Inactive Facilities</option>
          </Select>
        </div>

        {/* Reset Filters */}
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="h-9 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      {/* Create Trigger */}
      {canCreate && (
        <Button size="sm" onClick={onCreateClick} className="h-9 gap-1.5 text-xs font-semibold">
          <Plus className="h-4 w-4" /> Add Warehouse
        </Button>
      )}
    </div>
  );
};
