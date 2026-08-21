import { z } from 'zod';

export const bomStatusSchema = z.enum(['draft', 'active', 'inactive', 'archived']);

export const createBomComponentSchema = z.object({
  component_product_id: z.string().uuid('Component product ID must be a valid UUID'),
  quantity: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Quantity must be a positive number greater than 0',
    }),
  unit: z.string().trim().optional(),
  scrap_percentage: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : 0))
    .refine((val) => !isNaN(val) && val >= 0 && val <= 100, {
      message: 'Scrap percentage must be between 0 and 100',
    }),
  sequence: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : 1))
    .refine((val) => Number.isInteger(val) && val >= 0, {
      message: 'Sequence must be a non-negative integer',
    }),
  notes: z.string().trim().nullable().optional(),
});

export const createBomSchema = z.object({
  product_id: z.string().uuid('Product ID must be a valid UUID'),
  bom_number: z.string().trim().max(100, 'BOM number cannot exceed 100 characters').optional(),
  revision: z.string().trim().max(50, 'Revision cannot exceed 50 characters').optional(),
  version: z.union([z.number().int().positive(), z.string()]).optional(),
  name: z.string().trim().max(255, 'BOM name cannot exceed 255 characters').optional(),
  status: z.enum(['draft']).optional().default('draft'),
  effective_from: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  effective_to: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  is_default: z.boolean().optional().default(false),
  notes: z.string().trim().nullable().optional(),
  components: z.array(createBomComponentSchema).optional(),
});

export const updateBomSchema = z.object({
  name: z.string().trim().max(255, 'BOM name cannot exceed 255 characters').optional(),
  effective_from: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  effective_to: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  notes: z.string().trim().nullable().optional(),
});

export const createBomItemSchema = createBomComponentSchema;

export const updateBomItemSchema = z.object({
  quantity: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: 'Quantity must be a positive number greater than 0',
    }),
  unit: z.string().trim().optional(),
  scrap_percentage: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0 && val <= 100), {
      message: 'Scrap percentage must be between 0 and 100',
    }),
  sequence: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : undefined))
    .refine((val) => val === undefined || (Number.isInteger(val) && val >= 0), {
      message: 'Sequence must be a non-negative integer',
    }),
  notes: z.string().trim().nullable().optional(),
});

export const listBomsQuerySchema = z.object({
  page: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : 1)),
  pageSize: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : 20)),
  limit: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : 20)),
  sortBy: z.string().optional(),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform((val) => (val ? (val.toLowerCase() as 'asc' | 'desc') : undefined)),
  query: z.string().optional(),
  search: z.string().optional(),
  productId: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  bomNumber: z.string().optional(),
  bom_number: z.string().optional(),
  version: z.string().optional(),
  status: bomStatusSchema.optional(),
  is_default: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? val === 'true' : undefined)),
});

export const bomParamsSchema = z.object({
  id: z.string().uuid('BOM ID must be a valid UUID'),
});

export const bomItemParamsSchema = z.object({
  id: z.string().uuid('BOM ID must be a valid UUID'),
  componentId: z.string().uuid('Component ID must be a valid UUID'),
});

export const productBomsParamsSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
});
