import { PurchaseOrderStatus } from '@/services/purchaseOrders.service';

export type PurchaseStatusFilterOption = 'ALL' | PurchaseOrderStatus;

export interface PurchaseOrderFilterState {
  search: string;
  status: PurchaseStatusFilterOption;
  supplierId?: string;
  warehouseId?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const PURCHASE_ORDER_STATUS_OPTIONS: { label: string; value: PurchaseStatusFilterOption }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Processing', value: 'processing' },
  { label: 'Partially Received', value: 'partially_received' },
  { label: 'Received', value: 'received' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export interface DraftPurchaseLine {
  id: string; // temporary client ID or line ID
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: string;
  unit_cost: string;
  tax_rate: string;
  discount_amount: string;
  tax_amount: string;
  line_total: string;
}
