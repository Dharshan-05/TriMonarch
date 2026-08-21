import { apiClient } from '@/lib/api/client';
import { BaseQueryParams } from '@/types/api';

export interface ManufacturingOrder {
  id: string;
  orderNumber: string;
  productId: string;
  quantity: number;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
}

export const manufacturingService = {
  getOrders: async (params?: BaseQueryParams): Promise<ManufacturingOrder[]> => {
    return apiClient.get<ManufacturingOrder[]>('/manufacturing-orders', { params });
  },

  getOrderById: async (id: string): Promise<ManufacturingOrder> => {
    return apiClient.get<ManufacturingOrder>(`/manufacturing-orders/${id}`);
  },
};
