import { z } from 'zod';

export const createUserSchema = z.object({
  organization_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional().default('active'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
});
