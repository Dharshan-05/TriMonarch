import { z } from 'zod';

export const createDepartmentSchema = z.object({
  organization_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
});
