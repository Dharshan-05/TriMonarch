import { z } from 'zod';
import { quantitySchema } from './decimal.schema';

export const updateInventorySchema = z.object({
  quantity: quantitySchema.optional(),
  reorder_level: quantitySchema.optional(),
});
