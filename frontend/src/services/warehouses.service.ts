import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export type WarehouseStatus = 'active' | 'inactive';

export interface Warehouse {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  location: string | null;
  status: WarehouseStatus;
  created_at: string;
  updated_at: string;
}

export interface WarehouseQueryParams extends BaseQueryParams {
  search?: string;
  query?: string;
  status?: WarehouseStatus | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateWarehouseInput {
  organization_id?: string;
  name: string;
  code: string;
  location?: string | null;
  status?: WarehouseStatus;
}

export interface UpdateWarehouseInput {
  name?: string;
  location?: string | null;
  status?: WarehouseStatus;
}

export const warehousesService = {
  getWarehouses: async (
    params?: WarehouseQueryParams,
  ): Promise<ApiPaginatedResponse<Warehouse>> => {
    return apiClient.get<ApiPaginatedResponse<Warehouse>>('/warehouses', { params });
  },

  getWarehouseById: async (id: string): Promise<Warehouse> => {
    const response = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    if (!response.data) throw new Error('Warehouse record not found');
    return response.data;
  },

  createWarehouse: async (data: CreateWarehouseInput): Promise<Warehouse> => {
    const response = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', data);
    if (!response.data) throw new Error('Failed to create warehouse record');
    return response.data;
  },

  updateWarehouse: async (id: string, data: UpdateWarehouseInput): Promise<Warehouse> => {
    const response = await apiClient.patch<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    if (!response.data) throw new Error('Failed to update warehouse record');
    return response.data;
  },
};
