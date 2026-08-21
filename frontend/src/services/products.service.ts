import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export interface Product {
  id: string;
  organization_id?: string;
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  unit?: string;
  price?: string;
  cost?: string;
  tax_rate?: string;
  status: ProductStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ProductQueryParams extends BaseQueryParams {
  search?: string;
  query?: string;
  category?: string;
  status?: ProductStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  unit?: string;
  price?: string;
  cost?: string;
  tax_rate?: string;
  status?: ProductStatus;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  unit?: string;
  price?: string;
  cost?: string;
  tax_rate?: string;
  status?: ProductStatus;
}

export const productsService = {
  getProducts: async (params?: ProductQueryParams): Promise<ApiPaginatedResponse<Product>> => {
    return apiClient.get<ApiPaginatedResponse<Product>>('/products', { params });
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    if (!response.data) throw new Error('Product not found');
    return response.data;
  },

  createProduct: async (data: CreateProductInput): Promise<Product> => {
    const response = await apiClient.post<ApiResponse<Product>>('/products', data);
    if (!response.data) throw new Error('Failed to create product');
    return response.data;
  },

  updateProduct: async (id: string, data: UpdateProductInput): Promise<Product> => {
    const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, data);
    if (!response.data) throw new Error('Failed to update product');
    return response.data;
  },

  updateProductStatus: async (id: string, status: ProductStatus): Promise<Product> => {
    const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}/status`, { status });
    if (!response.data) throw new Error('Failed to update product status');
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
