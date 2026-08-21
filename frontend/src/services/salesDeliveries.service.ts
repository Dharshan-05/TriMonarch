import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export type SalesDeliveryStatus =
  | 'draft'
  | 'confirmed'
  | 'picking'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface SalesDeliveryItem {
  id: string;
  organization_id?: string;
  delivery_id: string;
  sales_order_item_id: string;
  product_id: string;
  quantity: string;
  product_name?: string;
  sku?: string;
  ordered_quantity?: string;
  delivered_quantity?: string;
  pending_quantity?: string;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalesDelivery {
  id: string;
  organization_id?: string;
  sales_order_id: string;
  delivery_number: string;
  warehouse_id: string;
  status: SalesDeliveryStatus;
  delivery_date: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  order_number?: string;
  customer_id?: string;
  customer_name?: string;
  warehouse_name?: string;
  items?: SalesDeliveryItem[];
}

export interface SalesDeliveryQueryParams extends BaseQueryParams {
  search?: string;
  query?: string;
  salesOrderId?: string;
  warehouseId?: string;
  status?: SalesDeliveryStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSalesDeliveryInput {
  sales_order_id: string;
  warehouse_id: string;
  delivery_number?: string;
  delivery_date?: string;
  notes?: string | null;
  items?: Array<{
    sales_order_item_id: string;
    product_id: string;
    quantity: string;
  }>;
}

export interface AddDeliveryItemInput {
  sales_order_item_id: string;
  product_id: string;
  quantity: string;
}

export const salesDeliveriesService = {
  getDeliveries: async (params?: SalesDeliveryQueryParams): Promise<ApiPaginatedResponse<SalesDelivery>> => {
    return apiClient.get<ApiPaginatedResponse<SalesDelivery>>('/deliveries', { params });
  },

  getDeliveryById: async (id: string): Promise<SalesDelivery> => {
    const response = await apiClient.get<ApiResponse<SalesDelivery>>(`/deliveries/${id}`);
    if (!response.data) throw new Error('Sales delivery not found');
    return response.data;
  },

  createDelivery: async (data: CreateSalesDeliveryInput): Promise<SalesDelivery> => {
    const response = await apiClient.post<ApiResponse<SalesDelivery>>('/deliveries', data);
    if (!response.data) throw new Error('Failed to create sales delivery');
    return response.data;
  },

  addDeliveryItem: async (id: string, item: AddDeliveryItemInput): Promise<SalesDeliveryItem> => {
    const response = await apiClient.post<ApiResponse<SalesDeliveryItem>>(`/deliveries/${id}/items`, item);
    if (!response.data) throw new Error('Failed to add delivery line item');
    return response.data;
  },

  removeDeliveryItem: async (id: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/deliveries/${id}/items/${itemId}`);
  },

  // State machine transition endpoints
  confirmDelivery: async (id: string): Promise<SalesDelivery> => {
    const response = await apiClient.post<ApiResponse<SalesDelivery>>(`/deliveries/${id}/confirm`);
    if (!response.data) throw new Error('Failed to confirm delivery');
    return response.data;
  },

  startPicking: async (id: string): Promise<SalesDelivery> => {
    const response = await apiClient.post<ApiResponse<SalesDelivery>>(`/deliveries/${id}/picking`);
    if (!response.data) throw new Error('Failed to start picking');
    return response.data;
  },

  markPacked: async (id: string): Promise<SalesDelivery> => {
    const response = await apiClient.post<ApiResponse<SalesDelivery>>(`/deliveries/${id}/pack`);
    if (!response.data) throw new Error('Failed to mark packed');
    return response.data;
  },

  shipDelivery: async (id: string): Promise<SalesDelivery> => {
    const response = await apiClient.post<ApiResponse<SalesDelivery>>(`/deliveries/${id}/ship`);
    if (!response.data) throw new Error('Failed to ship delivery');
    return response.data;
  },

  deliverDelivery: async (id: string): Promise<SalesDelivery> => {
    const response = await apiClient.post<ApiResponse<SalesDelivery>>(`/deliveries/${id}/deliver`);
    if (!response.data) throw new Error('Failed to mark as delivered');
    return response.data;
  },

  cancelDelivery: async (id: string): Promise<SalesDelivery> => {
    const response = await apiClient.post<ApiResponse<SalesDelivery>>(`/deliveries/${id}/cancel`);
    if (!response.data) throw new Error('Failed to cancel delivery');
    return response.data;
  },
};
