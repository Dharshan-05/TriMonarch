import { describe, it, expect, vi, beforeEach } from 'vitest';
import { componentAvailabilityService } from '../src/services/componentAvailability.service';
import { componentAvailabilityEngine } from '../src/services/componentAvailability.engine';

describe('Component Availability Service (Phase 035)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate availability check and readiness calculation to engine', async () => {
    const mockResult = {
      manufacturing_order_id: moId,
      warehouse_id: 'wh-001',
      status: 'READY' as const,
      ready: true,
      components: [],
      total_components: 0,
      available_components: 0,
      shortage_components: 0,
    };

    vi.spyOn(componentAvailabilityEngine, 'calculateAvailability').mockResolvedValue(mockResult);

    const res1 = await componentAvailabilityService.checkManufacturingOrderAvailability(orgId, moId);
    expect(res1).toEqual(mockResult);

    const res2 = await componentAvailabilityService.getReadiness(orgId, moId);
    expect(res2.ready_for_execution).toBe(true);
    expect(res2.component_availability).toEqual(mockResult);
  });
});
