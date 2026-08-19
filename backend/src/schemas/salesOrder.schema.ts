import { z } from 'zod';
import { decimalStringSchema, moneySchema, quantitySchema, rateSchema } from './decimal.schema';

export const salesOrderStatusSchema = z.enum([
  'draft',
  'confirmed',
  'processing',
  'shipped',
  'completed',
  'cancelled',
]);

export const createSalesOrderItemSchema = z.object({
  organization_id: z.string().uuid().optional(),
  sales_order_id: z.string().uuid().optional(),
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }),
  quantity: decimalStringSchema({ min: '0.0001', allowNegative: false, scale: 4 }),
  unit_price: moneySchema,
  discount_amount: moneySchema.optional().default('0.0000'),
  tax_rate: rateSchema.optional().default('0.000000'),
  tax_amount: moneySchema.optional().default('0.0000'),
  line_total: moneySchema.optional().default('0.0000'),
  sequence: z.number().int().positive().optional(),
});

export const updateSalesOrderItemSchema = z.object({
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }).optional(),
  quantity: quantitySchema.optional(),
  unit_price: moneySchema.optional(),
  discount_amount: moneySchema.optional(),
  tax_rate: rateSchema.optional(),
  tax_amount: moneySchema.optional(),
  line_total: moneySchema.optional(),
  sequence: z.number().int().positive().optional(),
});

export const createSalesOrderSchema = z.object({
  organization_id: z.string().uuid({ message: 'organization_id must be a valid UUID' }).optional(),
  customer_id: z.string().uuid({ message: 'customer_id must be a valid UUID' }),
  order_number: z
    .string()
    .min(1, { message: 'order_number cannot be empty' })
    .max(100, { message: 'order_number cannot exceed 100 characters' }),
  order_date: z.coerce.date().optional(),
  status: salesOrderStatusSchema.optional().default('draft'),
  currency: z
    .string()
    .min(1, { message: 'currency cannot be empty' })
    .max(10, { message: 'currency cannot exceed 10 characters' })
    .optional()
    .default('USD'),
  subtotal: moneySchema.optional().default('0.0000'),
  tax_amount: moneySchema.optional().default('0.0000'),
  discount_amount: moneySchema.optional().default('0.0000'),
  total_amount: moneySchema.optional().default('0.0000'),
  notes: z.string().nullable().optional(),
});

export const createSalesOrderWithItemsSchema = createSalesOrderSchema.extend({
  items: z.array(createSalesOrderItemSchema).min(1, { message: 'Sales order must contain at least one line item' }),
});

export const updateSalesOrderSchema = z.object({
  customer_id: z.string().uuid({ message: 'customer_id must be a valid UUID' }).optional(),
  order_number: z.string().min(1).max(100).optional(),
  order_date: z.coerce.date().optional(),
  status: salesOrderStatusSchema.optional(),
  currency: z.string().min(1).max(10).optional(),
  subtotal: moneySchema.optional(),
  tax_amount: moneySchema.optional(),
  discount_amount: moneySchema.optional(),
  total_amount: moneySchema.optional(),
  notes: z.string().nullable().optional(),
});
