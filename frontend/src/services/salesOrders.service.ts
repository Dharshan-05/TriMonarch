import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export type SalesOrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface SalesOrderItem {
  id?: string;
  organization_id?: string;
  sales_order_id?: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  discount_amount?: string;
  tax_rate?: string;
  tax_amount?: string;
  line_total?: string;
  sequence?: number;
  product_name?: string;
  sku?: string;
}

export interface SalesOrder {
  id: string;
  organization_id?: string;
  customer_id: string;
  order_number: string;
  order_date: string;
  status: SalesOrderStatus;
  currency: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: SalesOrderItem[];
  customer_name?: string;
}

export interface SalesOrderQueryParams extends BaseQueryParams {
  search?: string;
  query?: string;
  customerId?: string;
  customer_id?: string;
  status?: SalesOrderStatus;
  orderDate?: string;
  order_date?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSalesOrderItemInput {
  product_id: string;
  quantity: string;
  unit_price: string;
  discount_amount?: string;
  tax_rate?: string;
  tax_amount?: string;
  line_total?: string;
  sequence?: number;
}

export interface CreateSalesOrderInput {
  customer_id: string;
  order_number: string;
  order_date?: string;
  status?: SalesOrderStatus;
  currency?: string;
  subtotal?: string;
  tax_amount?: string;
  discount_amount?: string;
  total_amount?: string;
  notes?: string | null;
  items?: CreateSalesOrderItemInput[];
}

export interface UpdateSalesOrderInput {
  customer_id?: string;
  order_number?: string;
  order_date?: string;
  status?: SalesOrderStatus;
  currency?: string;
  subtotal?: string;
  tax_amount?: string;
  discount_amount?: string;
  total_amount?: string;
  notes?: string | null;
}

export interface UpdateSalesOrderStatusInput {
  status: SalesOrderStatus;
}

export const salesOrdersService = {
  getSalesOrders: async (params?: SalesOrderQueryParams): Promise<ApiPaginatedResponse<SalesOrder>> => {
    return apiClient.get<ApiPaginatedResponse<SalesOrder>>('/sales-orders', { params });
  },

  getSalesOrderById: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}`);
    if (!response.data) throw new Error('Sales order not found');
    return response.data;
  },

  createSalesOrder: async (data: CreateSalesOrderInput): Promise<SalesOrder> => {
    const response = await apiClient.post<ApiResponse<SalesOrder>>('/sales-orders', data);
    if (!response.data) throw new Error('Failed to create sales order');
    return response.data;
  },

  updateSalesOrder: async (id: string, data: UpdateSalesOrderInput): Promise<SalesOrder> => {
    const response = await apiClient.patch<ApiResponse<SalesOrder>>(`/sales-orders/${id}`, data);
    if (!response.data) throw new Error('Failed to update sales order');
    return response.data;
  },

  updateSalesOrderStatus: async (id: string, status: SalesOrderStatus): Promise<SalesOrder> => {
    const response = await apiClient.patch<ApiResponse<SalesOrder>>(`/sales-orders/${id}/status`, { status });
    if (!response.data) throw new Error('Failed to update sales order status');
    return response.data;
  },

  deleteSalesOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales-orders/${id}`);
  },

  addSalesOrderItem: async (id: string, item: CreateSalesOrderItemInput): Promise<SalesOrderItem> => {
    const response = await apiClient.post<ApiResponse<SalesOrderItem>>(`/sales-orders/${id}/items`, item);
    if (!response.data) throw new Error('Failed to add order line item');
    return response.data;
  },

  updateSalesOrderItem: async (
    id: string,
    itemId: string,
    item: Partial<CreateSalesOrderItemInput>,
  ): Promise<SalesOrderItem> => {
    const response = await apiClient.patch<ApiResponse<SalesOrderItem>>(
      `/sales-orders/${id}/items/${itemId}`,
      item,
    );
    if (!response.data) throw new Error('Failed to update order line item');
    return response.data;
  },

  deleteSalesOrderItem: async (id: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/sales-orders/${id}/items/${itemId}`);
  },
};
