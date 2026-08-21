import { z } from 'zod';

export const createUserSchema = z.object({
  organization_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters').optional(),
  phone: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional().default('active'),
  role: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  role: z.string().optional(),
});

export const userStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended', 'pending']),
});

export const userQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  query: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
});
