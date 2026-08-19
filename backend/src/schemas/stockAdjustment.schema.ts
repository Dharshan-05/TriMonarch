import { z } from 'zod';

export const STOCK_ADJUSTMENT_REASONS = [
  'PHYSICAL_COUNT',
  'CYCLE_COUNT',
  'DAMAGE',
  'LOSS',
  'FOUND',
  'RECONCILIATION',
  'OPENING_BALANCE',
  'DATA_CORRECTION',
  'OTHER',
] as const;

export type StockAdjustmentReason = (typeof STOCK_ADJUSTMENT_REASONS)[number];

export const createStockAdjustmentSchema = z
  .object({
    organization_id: z.string().uuid().optional(),
    product_id: z.string().uuid('product_id must be a valid UUID'),
    warehouse_id: z.string().uuid('warehouse_id must be a valid UUID'),
    delta_quantity: z.union([z.string(), z.number()]).optional(),
    target_quantity: z.union([z.string(), z.number()]).optional(),
    reason: z.string().optional().default('OTHER'),
    reference_type: z.string().optional().nullable(),
    reference_id: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      (data.delta_quantity !== undefined && data.target_quantity === undefined) ||
      (data.delta_quantity === undefined && data.target_quantity !== undefined),
    {
      message: 'Either delta_quantity or target_quantity must be provided, but not both',
      path: ['delta_quantity'],
    },
  );
