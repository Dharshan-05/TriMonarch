import { SalesOrderStatus } from '@/services/salesOrders.service';

export type StatusFilterOption = 'ALL' | SalesOrderStatus;

export interface SalesOrderFilterState {
  search: string;
  status: StatusFilterOption;
  customerId?: string;
  orderDate?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const SALES_ORDER_STATUS_OPTIONS: { label: string; value: StatusFilterOption }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Draft', value: 'draft' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export interface DraftOrderLine {
  id: string; // temporary client ID or line ID
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
  discount_amount: string;
  tax_amount: string;
  line_total: string;
}
