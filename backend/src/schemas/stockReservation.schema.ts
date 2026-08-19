import { z } from 'zod';
import { quantitySchema } from './decimal.schema';

export const createStockReservationSchema = z.object({
  organization_id: z.string().uuid().optional(),
  product_id: z.string().uuid('product_id must be a valid UUID'),
  warehouse_id: z.string().uuid('warehouse_id must be a valid UUID'),
  quantity: quantitySchema,
  reference_type: z.string().optional().nullable(),
  reference_id: z.string().optional().nullable(),
  expires_at: z.union([z.string(), z.date()]).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateStockReservationSchema = z.object({
  quantity: quantitySchema.optional(),
  expires_at: z.union([z.string(), z.date()]).optional().nullable(),
  notes: z.string().optional().nullable(),
});
