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
