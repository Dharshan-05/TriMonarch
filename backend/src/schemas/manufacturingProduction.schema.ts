import { z } from 'zod';

export const produceFinishedGoodsSchema = z.object({
  production_number: z
    .string()
    .min(1, { message: 'Production number is required' })
    .max(100, { message: 'Production number cannot exceed 100 characters' }),
  quantity: z.union([z.string(), z.number()]),
  notes: z.string().max(1000).optional(),
});

export const manufacturingOrderParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid Manufacturing Order ID format' }),
});

export const productionParamsSchema = z.object({
  productionId: z.string().uuid({ message: 'Invalid Production ID format' }),
});

export type ProduceFinishedGoodsInput = z.infer<typeof produceFinishedGoodsSchema>;
