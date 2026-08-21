import { z } from 'zod';

export const supplierInvoiceStatusSchema = z.enum([
  'draft',
  'posted',
  'partially_paid',
  'paid',
  'cancelled',
]);

export const createSupplierInvoiceItemSchema = z.object({
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }),
  purchase_order_item_id: z.string().uuid().optional().nullable(),
  purchase_receipt_item_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.union([z.number().positive(), z.string().min(1)]),
  unit_cost: z.union([z.number().nonnegative(), z.string()]),
  discount_amount: z.union([z.number().nonnegative(), z.string()]).optional(),
  tax_rate: z.union([z.number().min(0).max(100), z.string()]).optional(),
});

export const createSupplierInvoiceSchema = z.object({
  supplier_id: z.string().uuid({ message: 'supplier_id must be a valid UUID' }),
  purchase_order_id: z.string().uuid().optional().nullable(),
  purchase_receipt_id: z.string().uuid().optional().nullable(),
  invoice_number: z.string().min(1).max(100).optional(),
  supplier_invoice_number: z
    .string()
    .min(1, { message: 'supplier_invoice_number is required' })
    .max(100),
  invoice_date: z.union([z.string(), z.date()]).optional(),
  due_date: z.union([z.string(), z.date()]).optional().nullable(),
  currency: z.string().length(3).optional().default('INR'),
  notes: z.string().optional().nullable(),
  items: z.array(createSupplierInvoiceItemSchema).min(1, {
    message: 'Supplier invoice must contain at least one item',
  }),
});

export const updateSupplierInvoiceItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  description: z.string().optional().nullable(),
  quantity: z.union([z.number().positive(), z.string().min(1)]).optional(),
  unit_cost: z.union([z.number().nonnegative(), z.string()]).optional(),
  discount_amount: z.union([z.number().nonnegative(), z.string()]).optional(),
  tax_rate: z.union([z.number().min(0).max(100), z.string()]).optional(),
});

export const listSupplierInvoicesQuerySchema = z.object({
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
  supplier_id: z.string().uuid().optional(),
  purchase_order_id: z.string().uuid().optional(),
  purchase_receipt_id: z.string().uuid().optional(),
  status: supplierInvoiceStatusSchema.optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  due_date_from: z.string().optional(),
  due_date_to: z.string().optional(),
});

export const supplierInvoiceParamsSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export const supplierInvoiceItemParamsSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
  itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
});

export const supplierInvoicesBySupplierParamsSchema = z.object({
  supplierId: z.string().uuid({ message: 'supplierId must be a valid UUID' }),
});
