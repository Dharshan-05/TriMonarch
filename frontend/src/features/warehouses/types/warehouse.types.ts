import { WarehouseStatus } from '@/services/warehouses.service';

export interface WarehouseFilterState {
  search: string;
  status: 'ALL' | WarehouseStatus;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
