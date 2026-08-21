import { useQuery } from '@tanstack/react-query';
import { auditLogsService, AuditQueryParams } from '@/services/auditLogs.service';
import { queryKeys } from '@/queries/query-keys';

export const useAuditLogListQuery = (params?: AuditQueryParams) => {
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: () => auditLogsService.getAuditLogs(params),
    staleTime: 30 * 1000,
  });
};

export const useAuditLogDetailQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.audit.detail(id),
    queryFn: () => auditLogsService.getAuditLogById(id),
    enabled: Boolean(id) && enabled,
  });
};

export const useAuditLogStatsQuery = (params?: AuditQueryParams) => {
  return useQuery({
    queryKey: queryKeys.audit.stats(params),
    queryFn: () => auditLogsService.getStats(params),
    staleTime: 60 * 1000,
  });
};

export const useAuditLogEventsQuery = () => {
  return useQuery({
    queryKey: queryKeys.audit.events(),
    queryFn: () => auditLogsService.getAvailableEvents(),
    staleTime: 10 * 60 * 1000,
  });
};
