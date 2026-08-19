import { z } from 'zod';

export const createWarehouseSchema = z.object({
  organization_id: z.string().uuid().optional(),
  name: z.string().min(1, 'name is required').max(255),
  code: z.string().min(1, 'code is required').max(50),
  location: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  location: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
});
