import { apiClient } from '@/lib/api/client';
import { LoginCredentials, LoginResult, AuthUser } from '../types/auth.types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResult> => {
    return apiClient.post<LoginResult>('/auth/login', credentials);
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    return apiClient.get<AuthUser>('/auth/me');
  },

  refreshToken: async (refreshToken: string): Promise<LoginResult> => {
    return apiClient.post<LoginResult>('/auth/refresh', { refreshToken });
  },

  logout: async (refreshToken?: string): Promise<void> => {
    return apiClient.post<void>('/auth/logout', { refreshToken });
  },
};
