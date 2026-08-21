import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export type PartnerType = 'customer' | 'supplier';
export type PartnerStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface Partner {
  id: string;
  organization_id?: string;
  type: PartnerType;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: PartnerStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PartnerQueryParams extends BaseQueryParams {
  type?: PartnerType;
  search?: string;
  query?: string;
  status?: PartnerStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePartnerInput {
  type: PartnerType;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: PartnerStatus;
}

export interface UpdatePartnerInput {
  type?: PartnerType;
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: PartnerStatus;
}

export const partnersService = {
  getPartners: async (params?: PartnerQueryParams): Promise<ApiPaginatedResponse<Partner>> => {
    return apiClient.get<ApiPaginatedResponse<Partner>>('/partners', { params });
  },

  getPartnerById: async (id: string, type?: PartnerType): Promise<Partner> => {
    const response = await apiClient.get<ApiResponse<Partner>>(`/partners/${id}`, {
      params: { type },
    });
    if (!response.data) throw new Error('Partner not found');
    return response.data;
  },

  createPartner: async (data: CreatePartnerInput): Promise<Partner> => {
    const response = await apiClient.post<ApiResponse<Partner>>('/partners', data);
    if (!response.data) throw new Error('Failed to create partner');
    return response.data;
  },

  updatePartner: async (id: string, data: UpdatePartnerInput): Promise<Partner> => {
    const response = await apiClient.patch<ApiResponse<Partner>>(`/partners/${id}`, data);
    if (!response.data) throw new Error('Failed to update partner');
    return response.data;
  },

  deletePartner: async (id: string, type?: PartnerType): Promise<void> => {
    await apiClient.delete(`/partners/${id}`, { params: { type } });
  },
};
