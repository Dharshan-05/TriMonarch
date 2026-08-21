import { z } from 'zod';

export const uuidSchema = z.string().uuid({ message: 'Must be a valid UUID' });

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const paginationQuerySchema = z.object({
  page: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : 1))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: 'Page must be a positive integer greater than or equal to 1',
    }),
  pageSize: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : 20))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: 'Page size must be between 1 and 100',
    }),
  limit: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : 20))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  sortBy: z.string().optional(),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform((val) => (val ? (val.toLowerCase() as 'asc' | 'desc') : undefined)),
  organizationId: uuidSchema.optional(),
});

export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Invalid email address format' })
  .max(255, 'Email cannot exceed 255 characters');

export const searchSchema = z
  .string()
  .trim()
  .max(255, 'Search string cannot exceed 255 characters')
  .optional();

export const positiveDecimalSchema = z
  .union([z.number(), z.string()])
  .transform((val) => Number(val))
  .refine((val) => !isNaN(val) && isFinite(val) && val > 0, {
    message: 'Value must be a positive number greater than 0',
  });

export const nonNegativeDecimalSchema = z
  .union([z.number(), z.string()])
  .transform((val) => Number(val))
  .refine((val) => !isNaN(val) && isFinite(val) && val >= 0, {
    message: 'Value must be a non-negative number greater than or equal to 0',
  });

export const dateRangeSchema = z
  .object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      const from = data.dateFrom || data.startDate;
      const to = data.dateTo || data.endDate;
      if (from && to) {
        return new Date(from).getTime() <= new Date(to).getTime();
      }
      return true;
    },
    {
      message: 'Start date cannot be later than end date',
      path: ['dateFrom'],
    },
  );

export const createSortSchema = (allowedFields: string[]) =>
  z.object({
    sortBy: z
      .string()
      .optional()
      .refine(
        (val) => !val || allowedFields.includes(val),
        (val) => ({
          message: `Invalid sortBy field '${val}'. Allowed fields: ${allowedFields.join(', ')}`,
        }),
      ),
    sortOrder: z
      .enum(['asc', 'desc', 'ASC', 'DESC'])
      .optional()
      .transform((val) => (val ? (val.toLowerCase() as 'asc' | 'desc') : undefined)),
  });

export const idempotencyHeaderSchema = z.object({
  'idempotency-key': z
    .string()
    .trim()
    .min(8, 'Idempotency key must be at least 8 characters')
    .max(128, 'Idempotency key cannot exceed 128 characters')
    .optional(),
});
