import { z } from 'zod';

export const listAuditQuerySchema = z.object({
  category: z.string().optional(),
  action: z.string().optional(),
  entity_type: z.string().optional(),
  resource: z.string().optional(),
  entity_id: z.string().optional(),
  resourceId: z.string().optional(),
  user_id: z.string().optional(),
  actor_id: z.string().optional(),
  actorUserId: z.string().optional(),
  request_id: z.string().optional(),
  correlation_id: z.string().optional(),
  eventType: z.string().optional(),
  severity: z.string().optional(),
  ipAddress: z.string().optional(),
  search: z.string().optional(),
  success: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.union([z.number(), z.string().transform((v) => parseInt(v, 10))]).optional(),
  pageSize: z.union([z.number(), z.string().transform((v) => parseInt(v, 10))]).optional(),
  limit: z.union([z.number(), z.string().transform((v) => parseInt(v, 10))]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
});

export const entityAuditParamsSchema = z.object({
  entityType: z.string(),
  entityId: z.string().uuid({ message: 'Invalid entity ID format' }),
});

export const resourceAuditParamsSchema = z.object({
  resource: z.string(),
  resourceId: z.string(),
});

export const actorAuditParamsSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }).optional(),
  actorId: z.string().uuid({ message: 'Invalid actor ID format' }).optional(),
});

export const auditIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid audit log ID format' }),
});

export const auditExportQuerySchema = listAuditQuerySchema.extend({
  format: z.enum(['json', 'csv']).optional().default('json'),
  maxRecords: z
    .union([z.number(), z.string().transform((v) => parseInt(v, 10))])
    .optional()
    .transform((v) => (v ? Math.min(10000, v) : 1000)),
});
