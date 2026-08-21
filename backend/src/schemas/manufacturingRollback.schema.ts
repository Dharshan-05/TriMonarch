import { z } from 'zod';

export const reverseMaterialConsumptionSchema = z.object({
  manufacturing_order_item_id: z.string().uuid({ message: 'Invalid Manufacturing Order Item ID format' }),
  reversal_number: z
    .string()
    .min(1, { message: 'Reversal number is required' })
    .max(100, { message: 'Reversal number cannot exceed 100 characters' }),
  quantity: z.union([z.string(), z.number()]),
  reason: z.string().max(1000).optional(),
});

export const reverseFinishedGoodsProductionSchema = z.object({
  reversal_number: z
    .string()
    .min(1, { message: 'Reversal number is required' })
    .max(100, { message: 'Reversal number cannot exceed 100 characters' }),
  quantity: z.union([z.string(), z.number()]),
  reason: z.string().max(1000).optional(),
});

export const cancelOrderWithReversalSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const manufacturingOrderParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid Manufacturing Order ID format' }),
});
