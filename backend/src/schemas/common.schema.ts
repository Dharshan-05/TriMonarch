import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid({ message: 'Parameter must be a valid UUID' }),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  organizationId: z.string().uuid().optional(),
});
