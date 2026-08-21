import { z } from 'zod';

export const paymentMethodSchema = z.enum([
  'cash',
  'bank_transfer',
  'upi',
  'card',
  'cheque',
  'other',
]);

export const recordSupplierPaymentSchema = z.object({
  payment_number: z.string().min(1).max(100).optional(),
  payment_date: z.union([z.string(), z.date()]).optional(),
  amount: z.union([z.number().positive(), z.string().min(1)]),
  payment_method: paymentMethodSchema,
  reference_number: z.string().max(150).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const listSupplierPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional().default('created_at'),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .transform((val) => val.toLowerCase() as 'asc' | 'desc')
    .optional()
    .default('desc'),
  supplier_id: z.string().uuid().optional(),
  supplier_invoice_id: z.string().uuid().optional(),
  payment_method: paymentMethodSchema.optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});
