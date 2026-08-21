export interface StockLedgerFilterState {
  inventoryId?: string;
  productId?: string;
  warehouseId?: string;
  movementType: string; // 'ALL' or specific type
  search: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const MOVEMENT_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Movement Types', value: 'ALL' },
  { label: 'Receipt (IN)', value: 'IN' },
  { label: 'Issue (OUT)', value: 'OUT' },
  { label: 'Stock Adjustment', value: 'ADJUSTMENT' },
  { label: 'Transfer In', value: 'TRANSFER_IN' },
  { label: 'Transfer Out', value: 'TRANSFER_OUT' },
];
