import { z } from 'zod';

export const purchaseOrderStatusSchema = z.enum([
  'draft',
  'submitted',
  'approved',
  'processing',
  'partially_received',
  'received',
  'completed',
  'cancelled',
]);

export const purchaseOrderStatusUpdateSchema = z.object({
  status: purchaseOrderStatusSchema,
});

export const createPurchaseOrderItemSchema = z.object({
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }),
  quantity: z.union([z.number().positive(), z.string().min(1)]),
  unit_cost: z.union([z.number().nonnegative(), z.string().min(1)]),
  discount_amount: z.union([z.number().nonnegative(), z.string()]).optional(),
  tax_rate: z.union([z.number().nonnegative(), z.string()]).optional(),
});

export const createPurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid({ message: 'supplier_id must be a valid UUID' }),
  warehouse_id: z.string().uuid({ message: 'warehouse_id must be a valid UUID' }).optional().nullable(),
  order_number: z.string().min(1).max(100).optional(),
  order_date: z.union([z.string(), z.date()]).optional(),
  expected_delivery_date: z.union([z.string(), z.date()]).optional().nullable(),
  currency: z.string().min(1).max(10).optional().default('USD'),
  notes: z.string().optional().nullable(),
  items: z.array(createPurchaseOrderItemSchema).min(1, {
    message: 'Purchase order must contain at least one item',
  }),
});

export const updatePurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid({ message: 'supplier_id must be a valid UUID' }).optional(),
  warehouse_id: z.string().uuid({ message: 'warehouse_id must be a valid UUID' }).optional().nullable(),
  order_number: z.string().min(1).max(100).optional(),
  order_date: z.union([z.string(), z.date()]).optional(),
  expected_delivery_date: z.union([z.string(), z.date()]).optional().nullable(),
  currency: z.string().min(1).max(10).optional(),
  notes: z.string().optional().nullable(),
  status: purchaseOrderStatusSchema.optional(),
});

export const updatePurchaseOrderItemSchema = z.object({
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }).optional(),
  quantity: z.union([z.number().positive(), z.string().min(1)]).optional(),
  unit_cost: z.union([z.number().nonnegative(), z.string().min(1)]).optional(),
  discount_amount: z.union([z.number().nonnegative(), z.string()]).optional(),
  tax_rate: z.union([z.number().nonnegative(), z.string()]).optional(),
});

export const listPurchaseOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional().default('order_number'),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .transform((val) => val.toLowerCase() as 'asc' | 'desc')
    .optional()
    .default('desc'),
  query: z.string().optional(),
  search: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  status: purchaseOrderStatusSchema.optional(),
  orderDate: z.string().optional(),
  order_date: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  expected_delivery_date: z.string().optional(),
});

export const purchaseOrderParamsSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export const purchaseOrderItemParamsSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
  itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
});
