import { auditLogsService, AuditLog as RealAuditLog, AuditQueryParams } from './auditLogs.service';
import { BaseQueryParams } from '@/types/api';

export type AuditLog = RealAuditLog;

export const auditService = {
  getLogs: async (params?: BaseQueryParams): Promise<AuditLog[]> => {
    const res = await auditLogsService.getAuditLogs(params as AuditQueryParams);
    return res.data || [];
  },

  getAuditLogs: auditLogsService.getAuditLogs,
  getAuditLogById: auditLogsService.getAuditLogById,
  getStats: auditLogsService.getStats,
  getAvailableEvents: auditLogsService.getAvailableEvents,
};
