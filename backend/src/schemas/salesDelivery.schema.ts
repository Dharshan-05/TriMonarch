import { z } from 'zod';
import { quantitySchema } from './decimal.schema';

export const salesDeliveryStatusSchema = z.enum([
  'draft',
  'confirmed',
  'picking',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
]);

export const createSalesDeliverySchema = z.object({
  sales_order_id: z.string().uuid({ message: 'sales_order_id must be a valid UUID' }),
  warehouse_id: z.string().uuid({ message: 'warehouse_id must be a valid UUID' }),
  delivery_number: z.string().trim().min(1).max(100).optional(),
  delivery_date: z.string().or(z.date()).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const addDeliveryItemSchema = z.object({
  sales_order_item_id: z.string().uuid({ message: 'sales_order_item_id must be a valid UUID' }),
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }),
  quantity: quantitySchema,
});

export const updateSalesDeliverySchema = z.object({
  warehouse_id: z.string().uuid().optional(),
  delivery_date: z.string().or(z.date()).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const listDeliveriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional().default('created_at'),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .transform((val) => val.toLowerCase() as 'asc' | 'desc')
    .optional()
    .default('desc'),
  query: z.string().optional(),
  salesOrderId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  status: salesDeliveryStatusSchema.optional(),
});

export const deliveryParamsSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export const deliveryItemParamsSchema = z.object({
  id: z.string().uuid({ message: 'delivery id must be a valid UUID' }),
  itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
});

export const salesOrderDeliveryParamsSchema = z.object({
  salesOrderId: z.string().uuid({ message: 'salesOrderId must be a valid UUID' }),
});
