import { z } from 'zod';

export const componentAvailabilityParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid Manufacturing Order ID format' }),
});

export type ComponentAvailabilityParams = z.infer<typeof componentAvailabilityParamsSchema>;
