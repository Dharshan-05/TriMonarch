import { z } from 'zod';

export const createPartnerSchema = z.object({
  type: z.enum(['customer', 'supplier']).optional().default('customer'),
  organization_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional().default('active'),
});

export const updatePartnerSchema = z.object({
  type: z.enum(['customer', 'supplier']).optional().default('customer'),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
});

export const partnerStatusSchema = z.object({
  type: z.enum(['customer', 'supplier']).optional().default('customer'),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']),
});

export const partnerQuerySchema = z.object({
  type: z.enum(['customer', 'supplier']).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  query: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
});
