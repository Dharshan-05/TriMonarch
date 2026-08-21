import { AuditCategory, AuditAction, AuditEntityType, AuditLog, AuditStats } from '@/services/auditLogs.service';

export interface AuditLogFilterState {
  search: string;
  category: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  success: string; // 'ALL' | 'true' | 'false'
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export type { AuditCategory, AuditAction, AuditEntityType, AuditLog, AuditStats };
