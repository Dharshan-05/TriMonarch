import { SalesDeliveryStatus } from '@/services/salesDeliveries.service';

export type DeliveryStatusFilterOption = 'ALL' | SalesDeliveryStatus;

export interface SalesDeliveryFilterState {
  search: string;
  status: DeliveryStatusFilterOption;
  salesOrderId?: string;
  warehouseId?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const SALES_DELIVERY_STATUS_OPTIONS: { label: string; value: DeliveryStatusFilterOption }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Draft', value: 'draft' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Picking', value: 'picking' },
  { label: 'Packed', value: 'packed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export interface DraftDeliveryLine {
  sales_order_item_id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  ordered_quantity?: string;
  quantity: string;
}
