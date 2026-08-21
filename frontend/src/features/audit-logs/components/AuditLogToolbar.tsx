import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { AuditLogFilterState } from '../types/audit-log.types';
import { Search, RotateCcw } from 'lucide-react';

interface AuditLogToolbarProps {
  filters: AuditLogFilterState;
  onFilterChange: (updated: Partial<AuditLogFilterState>) => void;
  onResetFilters: () => void;
  availableEvents?: string[];
}

export const AuditLogToolbar: React.FC<AuditLogToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  return (
    <div className="flex flex-col space-y-3 p-4 rounded-lg border bg-card shadow-subtle">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search reason, entity ID, actor ID, or request ID..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="pl-9 text-xs h-9"
          />
        </div>

        {/* Action Filter */}
        <div className="w-full sm:w-[160px]">
          <Select
            value={filters.action}
            onChange={(e) => onFilterChange({ action: e.target.value, page: 1 })}
            className="text-xs h-9"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="AUTH_FAILURE">AUTH_FAILURE</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
            <option value="READ">READ</option>
            <option value="EXPORT">EXPORT</option>
            <option value="ROLE_ASSIGN">ROLE_ASSIGN</option>
            <option value="ROLE_REMOVE">ROLE_REMOVE</option>
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div className="w-full sm:w-[170px]">
          <Select
            value={filters.entity_type}
            onChange={(e) => onFilterChange({ entity_type: e.target.value, page: 1 })}
            className="text-xs h-9"
          >
            <option value="ALL">All Entity Types</option>
            <option value="USER">User</option>
            <option value="ROLE">Role</option>
            <option value="ORGANIZATION">Organization</option>
            <option value="PRODUCT">Product</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="INVENTORY">Inventory</option>
            <option value="SALES_ORDER">Sales Order</option>
            <option value="SALES_DELIVERY">Sales Delivery</option>
            <option value="PURCHASE_ORDER">Purchase Order</option>
            <option value="PURCHASE_RECEIPT">Purchase Receipt</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="AUTHENTICATION">Authentication</option>
          </Select>
        </div>

        {/* Success Status Filter */}
        <div className="w-full sm:w-[140px]">
          <Select
            value={filters.success}
            onChange={(e) => onFilterChange({ success: e.target.value, page: 1 })}
            className="text-xs h-9"
          >
            <option value="ALL">All Outcomes</option>
            <option value="true">Success Only</option>
            <option value="false">Failed Only</option>
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

      {/* Date Range Inputs */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Date Range:</span>
        <div className="flex items-center gap-1.5">
          <label htmlFor="audit-start-date" className="text-[11px]">From:</label>
          <Input
            id="audit-start-date"
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ startDate: e.target.value, page: 1 })}
            className="h-8 text-xs w-[140px]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor="audit-end-date" className="text-[11px]">To:</label>
          <Input
            id="audit-end-date"
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ endDate: e.target.value, page: 1 })}
            className="h-8 text-xs w-[140px]"
          />
        </div>
      </div>
    </div>
  );
};
