import { z } from 'zod';
import { quantitySchema } from './decimal.schema';

export const createInventorySchema = z.object({
  organization_id: z.string().uuid().optional(),
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }),
  warehouse_id: z.string().uuid({ message: 'warehouse_id must be a valid UUID' }),
  quantity: quantitySchema.optional().default('0.0000'),
  reorder_level: quantitySchema.optional().default('0.0000'),
});

export const updateInventorySchema = z.object({
  quantity: quantitySchema.optional(),
  reorder_level: quantitySchema.optional(),
});

export const adjustInventorySchema = z.object({
  target_quantity: quantitySchema.optional(),
  delta_quantity: quantitySchema.optional(),
  quantity: quantitySchema.optional(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  reference_type: z.string().optional().nullable(),
  reference_id: z.string().optional().nullable(),
});

export const inventoryQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  query: z.string().optional(),
  productId: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  status: z.string().optional(),
});
