export type StockStatusFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryFilterState {
  search: string;
  stockFilter: StockStatusFilter;
  productId?: string;
  warehouseId?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const STOCK_STATUS_FILTER_OPTIONS: { label: string; value: StockStatusFilter }[] = [
  { label: 'All Stock Levels', value: 'ALL' },
  { label: 'In Stock', value: 'IN_STOCK' },
  { label: 'Low Stock Alert', value: 'LOW_STOCK' },
  { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
];

export type AdjustmentMode = 'delta' | 'target';
