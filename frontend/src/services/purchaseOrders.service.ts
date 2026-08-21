import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export type PurchaseOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'processing'
  | 'partially_received'
  | 'received'
  | 'completed'
  | 'cancelled';

export interface PurchaseOrderItem {
  id?: string;
  organization_id?: string;
  purchase_order_id?: string;
  product_id: string;
  quantity: string;
  unit_cost: string;
  discount_amount?: string;
  tax_rate?: string;
  tax_amount?: string;
  line_total?: string;
  sequence?: number;
  product_name?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrder {
  id: string;
  organization_id?: string;
  supplier_id: string;
  warehouse_id?: string | null;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string | null;
  status: PurchaseOrderStatus;
  currency: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: PurchaseOrderItem[];
  supplier_name?: string;
  warehouse_name?: string;
}

export interface PurchaseOrderQueryParams extends BaseQueryParams {
  search?: string;
  query?: string;
  supplierId?: string;
  supplier_id?: string;
  warehouseId?: string;
  warehouse_id?: string;
  status?: PurchaseOrderStatus;
  orderDate?: string;
  order_date?: string;
  expectedDeliveryDate?: string;
  expected_delivery_date?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePurchaseOrderItemInput {
  product_id: string;
  quantity: string;
  unit_cost: string;
  discount_amount?: string;
  tax_rate?: string;
}

export interface CreatePurchaseOrderInput {
  supplier_id: string;
  warehouse_id?: string | null;
  order_number?: string;
  order_date?: string;
  expected_delivery_date?: string | null;
  currency?: string;
  notes?: string | null;
  items: CreatePurchaseOrderItemInput[];
}

export interface UpdatePurchaseOrderInput {
  supplier_id?: string;
  warehouse_id?: string | null;
  order_number?: string;
  order_date?: string;
  expected_delivery_date?: string | null;
  currency?: string;
  notes?: string | null;
  status?: PurchaseOrderStatus;
}

export const purchaseOrdersService = {
  getPurchaseOrders: async (params?: PurchaseOrderQueryParams): Promise<ApiPaginatedResponse<PurchaseOrder>> => {
    return apiClient.get<ApiPaginatedResponse<PurchaseOrder>>('/purchase-orders', { params });
  },

  getPurchaseOrderById: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    if (!response.data) throw new Error('Purchase order not found');
    return response.data;
  },

  createPurchaseOrder: async (data: CreatePurchaseOrderInput): Promise<PurchaseOrder> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data);
    if (!response.data) throw new Error('Failed to create purchase order');
    return response.data;
  },

  updatePurchaseOrder: async (id: string, data: UpdatePurchaseOrderInput): Promise<PurchaseOrder> => {
    const response = await apiClient.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, data);
    if (!response.data) throw new Error('Failed to update purchase order');
    return response.data;
  },

  updatePurchaseOrderStatus: async (id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> => {
    const response = await apiClient.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/status`, { status });
    if (!response.data) throw new Error('Failed to update purchase order status');
    return response.data;
  },

  deletePurchaseOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/purchase-orders/${id}`);
  },

  // State Transition Shortcuts
  submitPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/submit`);
    if (!response.data) throw new Error('Failed to submit purchase order');
    return response.data;
  },

  approvePurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve`);
    if (!response.data) throw new Error('Failed to approve purchase order');
    return response.data;
  },

  cancelPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`);
    if (!response.data) throw new Error('Failed to cancel purchase order');
    return response.data;
  },

  addPurchaseOrderItem: async (id: string, item: CreatePurchaseOrderItemInput): Promise<PurchaseOrderItem> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrderItem>>(`/purchase-orders/${id}/items`, item);
    if (!response.data) throw new Error('Failed to add order line item');
    return response.data;
  },

  removePurchaseOrderItem: async (id: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/purchase-orders/${id}/items/${itemId}`);
  },
};
