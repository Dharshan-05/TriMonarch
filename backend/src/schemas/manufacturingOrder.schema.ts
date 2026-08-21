import { z } from 'zod';

export const createManufacturingOrderSchema = z
  .object({
    product_id: z.string().uuid('Product ID must be a valid UUID'),
    bom_id: z.string().uuid('BOM ID must be a valid UUID'),
    warehouse_id: z.string().uuid('Warehouse ID must be a valid UUID'),
    mo_number: z.string().trim().max(100, 'MO number cannot exceed 100 characters').optional(),
    order_number: z.string().trim().max(100, 'Order number cannot exceed 100 characters').optional(),
    planned_quantity: z
      .union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine((val) => !isNaN(val) && isFinite(val) && val > 0, {
        message: 'Planned quantity must be a positive number greater than 0',
      }),
    planned_start_date: z
      .union([z.string(), z.date()])
      .nullable()
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
    planned_end_date: z
      .union([z.string(), z.date()])
      .nullable()
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
    notes: z.string().trim().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.planned_start_date && data.planned_end_date) {
        return data.planned_start_date.getTime() <= data.planned_end_date.getTime();
      }
      return true;
    },
    {
      message: 'Planned start date cannot be later than planned end date',
      path: ['planned_start_date'],
    },
  );

export const updateManufacturingOrderSchema = z
  .object({
    product_id: z.string().uuid('Product ID must be a valid UUID').optional(),
    bom_id: z.string().uuid('BOM ID must be a valid UUID').optional(),
    warehouse_id: z.string().uuid('Warehouse ID must be a valid UUID').optional(),
    planned_quantity: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined ? Number(val) : undefined))
      .refine((val) => val === undefined || (!isNaN(val) && isFinite(val) && val > 0), {
        message: 'Planned quantity must be a positive number greater than 0',
      }),
    planned_start_date: z
      .union([z.string(), z.date()])
      .nullable()
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
    planned_end_date: z
      .union([z.string(), z.date()])
      .nullable()
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
    notes: z.string().trim().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.planned_start_date && data.planned_end_date) {
        return data.planned_start_date.getTime() <= data.planned_end_date.getTime();
      }
      return true;
    },
    {
      message: 'Planned start date cannot be later than planned end date',
      path: ['planned_start_date'],
    },
  );

export const listManufacturingOrdersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  sortBy: z.string().optional(),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform((val) => (val ? (val.toLowerCase() as 'asc' | 'desc') : undefined)),
  query: z.string().optional(),
  productId: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  bomId: z.string().uuid().optional(),
  bom_id: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  status: z
    .enum(['draft', 'confirmed', 'planned', 'released', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  scheduledStartDate: z.string().optional(),
  scheduledEndDate: z.string().optional(),
});

export const manufacturingOrderParamsSchema = z.object({
  id: z.string().uuid('Manufacturing Order ID must be a valid UUID'),
});

export const productOrdersParamsSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
});

export const warehouseOrdersParamsSchema = z.object({
  warehouseId: z.string().uuid('Warehouse ID must be a valid UUID'),
});
