import { z } from 'zod';

export const consumeMaterialItemSchema = z.object({
  manufacturing_order_item_id: z.string().uuid({ message: 'Invalid Manufacturing Order Item ID format' }),
  quantity: z.union([z.string(), z.number()]),
});

export const consumeMaterialsSchema = z.object({
  items: z.array(consumeMaterialItemSchema).min(1, { message: 'Must provide at least one item to consume' }),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const manufacturingOrderParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid Manufacturing Order ID format' }),
});

export const consumptionParamsSchema = z.object({
  consumptionId: z.string().uuid({ message: 'Invalid Consumption ID format' }),
});

export type ConsumeMaterialItemInput = z.infer<typeof consumeMaterialItemSchema>;
export type ConsumeMaterialsRequestInput = z.infer<typeof consumeMaterialsSchema>;
