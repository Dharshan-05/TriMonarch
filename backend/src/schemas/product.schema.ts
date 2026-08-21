import { z } from 'zod';
import { moneySchema, rateSchema } from './decimal.schema';

export const createProductSchema = z.object({
  organization_id: z.string().uuid().optional(),
  sku: z.string().min(1, 'sku is required').max(100),
  name: z.string().min(1, 'name is required').max(255),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().optional().default('pcs'),
  price: moneySchema.optional().default('0.0000'),
  cost: moneySchema.optional().default('0.0000'),
  tax_rate: rateSchema.optional().default('0.000000'),
  status: z.enum(['active', 'inactive', 'discontinued']).optional().default('active'),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().optional(),
  price: moneySchema.optional(),
  cost: moneySchema.optional(),
  tax_rate: rateSchema.optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
});

export const productStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'discontinued']),
});

export const productQuerySchema = z.object({
  page: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : 1))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: 'Page must be a positive integer greater than or equal to 1',
    }),
  pageSize: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : 20))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: 'Page size must be between 1 and 100',
    }),
  limit: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : 20))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  sortBy: z.string().optional(),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform((val) => (val ? (val.toLowerCase() as 'asc' | 'desc') : undefined)),
  search: z.string().optional(),
  query: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
});
