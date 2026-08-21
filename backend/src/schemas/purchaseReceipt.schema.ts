import { z } from 'zod';

export const purchaseReceiptStatusSchema = z.enum(['draft', 'posted', 'completed', 'cancelled']);

export const createPurchaseReceiptItemSchema = z.object({
  purchase_order_item_id: z
    .string()
    .uuid({ message: 'purchase_order_item_id must be a valid UUID' }),
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }),
  quantity: z.union([z.number().positive(), z.string().min(1)]),
  unit_cost: z.union([z.number().nonnegative(), z.string()]).optional(),
});

export const createPurchaseReceiptSchema = z.object({
  purchase_order_id: z.string().uuid({ message: 'purchase_order_id must be a valid UUID' }),
  warehouse_id: z.string().uuid({ message: 'warehouse_id must be a valid UUID' }),
  receipt_number: z.string().min(1).max(100).optional(),
  receipt_date: z.union([z.string(), z.date()]).optional(),
  notes: z.string().optional().nullable(),
  items: z.array(createPurchaseReceiptItemSchema).min(1, {
    message: 'Purchase receipt must contain at least one item',
  }),
});

export const updatePurchaseReceiptItemSchema = z.object({
  quantity: z.union([z.number().positive(), z.string().min(1)]).optional(),
  unit_cost: z.union([z.number().nonnegative(), z.string()]).optional(),
});

export const listPurchaseReceiptsQuerySchema = z.object({
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
  purchaseOrderId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  status: purchaseReceiptStatusSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const purchaseReceiptParamsSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export const purchaseReceiptItemParamsSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
  itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
});

export const purchaseOrderReceiptParamsSchema = z.object({
  purchaseOrderId: z.string().uuid({ message: 'purchaseOrderId must be a valid UUID' }),
});
