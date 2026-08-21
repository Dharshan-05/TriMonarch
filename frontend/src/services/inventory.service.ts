import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export interface Inventory {
  id: string;
  organization_id?: string;
  product_id: string;
  warehouse_id: string;
  quantity: string;
  reorder_level: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields if available
  product_name?: string;
  sku?: string;
  warehouse_name?: string;
}

export interface InventoryQueryParams extends BaseQueryParams {
  search?: string;
  query?: string;
  productId?: string;
  product_id?: string;
  warehouseId?: string;
  warehouse_id?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateInventoryInput {
  product_id: string;
  warehouse_id: string;
  quantity?: string;
  reorder_level?: string;
}

export interface UpdateInventoryInput {
  quantity?: string;
  reorder_level?: string;
}

export interface AdjustInventoryInput {
  target_quantity?: string;
  delta_quantity?: string;
  quantity?: string;
  reason?: string | null;
  notes?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
}

export interface StockLedgerEntry {
  id: string;
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  entry_type: string;
  quantity_delta: string;
  balance_after: string;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export const inventoryService = {
  getInventory: async (params?: InventoryQueryParams): Promise<ApiPaginatedResponse<Inventory>> => {
    return apiClient.get<ApiPaginatedResponse<Inventory>>('/inventory', { params });
  },

  getInventoryById: async (id: string): Promise<Inventory> => {
    const response = await apiClient.get<ApiResponse<Inventory>>(`/inventory/${id}`);
    if (!response.data) throw new Error('Inventory record not found');
    return response.data;
  },

  createInventory: async (data: CreateInventoryInput): Promise<Inventory> => {
    const response = await apiClient.post<ApiResponse<Inventory>>('/inventory', data);
    if (!response.data) throw new Error('Failed to create inventory record');
    return response.data;
  },

  updateInventory: async (id: string, data: UpdateInventoryInput): Promise<Inventory> => {
    const response = await apiClient.patch<ApiResponse<Inventory>>(`/inventory/${id}`, data);
    if (!response.data) throw new Error('Failed to update inventory record');
    return response.data;
  },

  adjustInventory: async (id: string, data: AdjustInventoryInput): Promise<Inventory> => {
    const response = await apiClient.patch<ApiResponse<Inventory>>(`/inventory/${id}/adjust`, data);
    if (!response.data) throw new Error('Failed to adjust stock');
    return response.data;
  },

  deleteInventory: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/${id}`);
  },

  getInventoryMovements: async (
    id: string,
    params?: BaseQueryParams,
  ): Promise<ApiPaginatedResponse<StockLedgerEntry>> => {
    return apiClient.get<ApiPaginatedResponse<StockLedgerEntry>>(`/inventory/${id}/movements`, { params });
  },
};
