import { describe, it, expect } from 'vitest';
import { businessEventService } from '../../../src/services/businessEvent.service';
import { orgAId } from './transactionFixtures';

describe('Phase 064 — Business Event Rollback Tests', () => {
  it('businessEventService emits event without error', async () => {
    await expect(
      businessEventService.emit({
        eventName: 'PRODUCT_CREATED',
        organization_id: orgAId,
        metadata: { product_id: 'p-1' },
      }),
    ).resolves.not.toThrow();
  });
});
