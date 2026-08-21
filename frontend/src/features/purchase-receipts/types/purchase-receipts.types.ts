import { PurchaseReceiptStatus } from '@/services/purchaseReceipts.service';

export type ReceiptStatusFilterOption = 'ALL' | PurchaseReceiptStatus;

export interface PurchaseReceiptFilterState {
  query: string;
  status: ReceiptStatusFilterOption;
  purchaseOrderId?: string;
  warehouseId?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const PURCHASE_RECEIPT_STATUS_OPTIONS: { label: string; value: ReceiptStatusFilterOption }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Draft', value: 'draft' },
  { label: 'Posted (Stock Received)', value: 'posted' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export interface DraftReceiptLine {
  id: string; // temporary client ID or line ID
  purchase_order_item_id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: string;
  unit_cost: string;
  ordered_quantity?: string;
  received_quantity?: string;
  pending_quantity?: string;
}
