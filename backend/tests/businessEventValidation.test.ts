import { describe, it, expect } from 'vitest';
import { businessEventService } from '../src/services/businessEvent.service';
import { ValidationError } from '../src/types';

describe('Business Event Validation Tests (Phase 040)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';

  it('should throw ValidationError if eventName is invalid or unknown', async () => {
    await expect(
      businessEventService.emit({
        eventName: 'INVALID_EVENT_NAME' as never,
        organization_id: orgId,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError if organization_id format is invalid', async () => {
    await expect(
      businessEventService.emit({
        eventName: 'SALES_ORDER_CREATED',
        organization_id: 'invalid-uuid',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
