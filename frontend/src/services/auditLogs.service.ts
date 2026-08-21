import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse, ApiResponse } from '@/types/api';

export type AuditCategory = 'CATEGORY_A' | 'CATEGORY_B' | 'CATEGORY_C';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'AUTH_FAILURE'
  | 'ACCESS_DENIED'
  | 'READ'
  | 'EXPORT'
  | 'ROLE_ASSIGN'
  | 'ROLE_REMOVE';

export type AuditEntityType =
  | 'ORGANIZATION'
  | 'USER'
  | 'ROLE'
  | 'DEPARTMENT'
  | 'EMPLOYEE'
  | 'PRODUCT'
  | 'WAREHOUSE'
  | 'INVENTORY'
  | 'CUSTOMER'
  | 'SUPPLIER'
  | 'SALES_ORDER'
  | 'SALES_DELIVERY'
  | 'PURCHASE_ORDER'
  | 'PURCHASE_RECEIPT'
  | 'SUPPLIER_INVOICE'
  | 'SUPPLIER_PAYMENT'
  | 'BOM'
  | 'MANUFACTURING_ORDER'
  | 'MANUFACTURING_MATERIAL_CONSUMPTION'
  | 'MANUFACTURING_PRODUCTION'
  | 'MANUFACTURING_REVERSAL'
  | 'AUTHENTICATION'
  | 'SESSION'
  | 'AUDIT_LOG';

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  actor_id?: string | null;
  category: AuditCategory;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string | null;
  request_id: string | null;
  correlation_id: string | null;
  reason: string | null;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  success: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditQueryParams extends BaseQueryParams {
  search?: string;
  query?: string;
  category?: AuditCategory | string;
  action?: AuditAction | string;
  entity_type?: AuditEntityType | string;
  entity_id?: string;
  user_id?: string;
  actor_id?: string;
  request_id?: string;
  correlation_id?: string;
  success?: boolean | string;
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditStats {
  totalLogs: number;
  actionBreakdown: Array<{ action: string; count: number }>;
  entityBreakdown: Array<{ entity_type: string; count: number }>;
  topUsers: Array<{ user_id: string; count: number }>;
}

export const auditLogsService = {
  getAuditLogs: async (
    params?: AuditQueryParams,
  ): Promise<ApiPaginatedResponse<AuditLog>> => {
    return apiClient.get<ApiPaginatedResponse<AuditLog>>('/audits', { params });
  },

  getAuditLogById: async (id: string): Promise<AuditLog> => {
    const response = await apiClient.get<ApiResponse<AuditLog>>(`/audits/${id}`);
    if (!response.data) throw new Error('Audit log record not found');
    return response.data;
  },

  getStats: async (params?: AuditQueryParams): Promise<AuditStats> => {
    const response = await apiClient.get<ApiResponse<AuditStats>>('/audits/stats', { params });
    if (!response.data) throw new Error('Failed to retrieve audit log statistics');
    return response.data;
  },

  getAvailableEvents: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<{ events: string[] }>>('/audits/events');
    return response.data?.events || [];
  },
};
