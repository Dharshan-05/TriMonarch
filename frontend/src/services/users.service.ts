import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface User {
  id: string;
  organization_id?: string;
  name: string;
  email: string;
  phone?: string | null;
  status: UserStatus;
  role?: string;
  roles?: string[];
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
}

export interface UserQueryParams extends BaseQueryParams {
  search?: string;
  query?: string;
  status?: UserStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  status?: UserStatus;
  role?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string | null;
  status?: UserStatus;
  role?: string;
}

export const usersService = {
  getUsers: async (params?: UserQueryParams): Promise<ApiPaginatedResponse<User>> => {
    return apiClient.get<ApiPaginatedResponse<User>>('/users', { params });
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    if (!response.data) throw new Error('User not found');
    return response.data;
  },

  getUserRoles: async (id: string): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<{ userId: string; roles: string[] }>>(`/users/${id}/roles`);
    return response.data?.roles || [];
  },

  createUser: async (data: CreateUserInput): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>('/users', data);
    if (!response.data) throw new Error('Failed to create user');
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserInput): Promise<User> => {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data);
    if (!response.data) throw new Error('Failed to update user');
    return response.data;
  },

  updateUserStatus: async (id: string, status: UserStatus): Promise<User> => {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { status });
    if (!response.data) throw new Error('Failed to update user status');
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
