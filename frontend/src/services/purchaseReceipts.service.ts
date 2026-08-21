import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export type PurchaseReceiptStatus = 'draft' | 'posted' | 'completed' | 'cancelled';

export interface PurchaseReceiptItem {
  id?: string;
  organization_id?: string;
  receipt_id?: string;
  purchase_order_item_id: string;
  product_id: string;
  quantity: string;
  unit_cost?: string;
  product_name?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseReceipt {
  id: string;
  organization_id?: string;
  purchase_order_id: string;
  receipt_number: string;
  warehouse_id: string;
  status: PurchaseReceiptStatus;
  receipt_date: string;
  received_at?: string | null;
  cancelled_at?: string | null;
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: PurchaseReceiptItem[];
  order_number?: string;
  warehouse_name?: string;
  supplier_name?: string;
}

export interface PurchaseReceiptQueryParams extends BaseQueryParams {
  query?: string;
  purchaseOrderId?: string;
  warehouseId?: string;
  status?: PurchaseReceiptStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePurchaseReceiptItemInput {
  purchase_order_item_id: string;
  product_id: string;
  quantity: string;
  unit_cost?: string;
}

export interface CreatePurchaseReceiptInput {
  purchase_order_id: string;
  warehouse_id: string;
  receipt_number?: string;
  receipt_date?: string;
  notes?: string | null;
  items: CreatePurchaseReceiptItemInput[];
}

export const purchaseReceiptsService = {
  getPurchaseReceipts: async (params?: PurchaseReceiptQueryParams): Promise<ApiPaginatedResponse<PurchaseReceipt>> => {
    return apiClient.get<ApiPaginatedResponse<PurchaseReceipt>>('/purchase-receipts', { params });
  },

  getPurchaseReceiptById: async (id: string): Promise<PurchaseReceipt> => {
    const response = await apiClient.get<ApiResponse<PurchaseReceipt>>(`/purchase-receipts/${id}`);
    if (!response.data) throw new Error('Purchase receipt not found');
    return response.data;
  },

  createPurchaseReceipt: async (data: CreatePurchaseReceiptInput): Promise<PurchaseReceipt> => {
    const response = await apiClient.post<ApiResponse<PurchaseReceipt>>('/purchase-receipts', data);
    if (!response.data) throw new Error('Failed to create purchase receipt');
    return response.data;
  },

  addReceiptItem: async (id: string, item: CreatePurchaseReceiptItemInput): Promise<PurchaseReceiptItem> => {
    const response = await apiClient.post<ApiResponse<PurchaseReceiptItem>>(`/purchase-receipts/${id}/items`, item);
    if (!response.data) throw new Error('Failed to add receipt item');
    return response.data;
  },

  updateReceiptItem: async (
    id: string,
    itemId: string,
    data: { quantity?: string; unit_cost?: string },
  ): Promise<PurchaseReceiptItem> => {
    const response = await apiClient.patch<ApiResponse<PurchaseReceiptItem>>(
      `/purchase-receipts/${id}/items/${itemId}`,
      data,
    );
    if (!response.data) throw new Error('Failed to update receipt item');
    return response.data;
  },

  removeReceiptItem: async (id: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/purchase-receipts/${id}/items/${itemId}`);
  },

  // State Transition Actions
  postReceipt: async (id: string): Promise<PurchaseReceipt> => {
    const response = await apiClient.post<ApiResponse<PurchaseReceipt>>(`/purchase-receipts/${id}/post`);
    if (!response.data) throw new Error('Failed to post purchase receipt');
    return response.data;
  },

  completeReceipt: async (id: string): Promise<PurchaseReceipt> => {
    const response = await apiClient.post<ApiResponse<PurchaseReceipt>>(`/purchase-receipts/${id}/complete`);
    if (!response.data) throw new Error('Failed to complete purchase receipt');
    return response.data;
  },

  cancelReceipt: async (id: string): Promise<PurchaseReceipt> => {
    const response = await apiClient.post<ApiResponse<PurchaseReceipt>>(`/purchase-receipts/${id}/cancel`);
    if (!response.data) throw new Error('Failed to cancel purchase receipt');
    return response.data;
  },
};
