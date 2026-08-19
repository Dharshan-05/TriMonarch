import { z } from 'zod';

export const createSupplierSchema = z.object({
  organization_id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'name is required').max(255),
  email: z.string().trim().toLowerCase().email().optional().nullable().or(z.literal('')),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateSupplierSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  email: z.string().trim().toLowerCase().email().optional().nullable().or(z.literal('')),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
});
