import { z } from 'zod';

export const bomExplosionSchema = z.object({
  product_id: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        if (typeof val === 'number') return !isNaN(val) && isFinite(val) && val > 0;
        const num = Number(val);
        return !isNaN(num) && isFinite(num) && num > 0;
      },
      { message: 'Quantity must be a positive number greater than 0' },
    ),
  bom_id: z.string().uuid('BOM ID must be a valid UUID').optional(),
  revision: z.union([z.string(), z.number()]).optional(),
  max_depth: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : 50))
    .refine((val) => Number.isInteger(val) && val >= 1 && val <= 100, {
      message: 'Max depth must be an integer between 1 and 100',
    }),
});

export const bomExplosionParamsSchema = z.object({
  id: z.string().uuid('BOM ID must be a valid UUID'),
});

export const bomExplosionQuerySchema = z.object({
  quantity: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? val : 1)),
  max_depth: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50)),
});
