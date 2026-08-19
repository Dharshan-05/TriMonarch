import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).optional().default('active'),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});
