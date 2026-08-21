import { describe, it, expect, vi } from 'vitest';
import { manufacturingOrderService } from '../../../src/services/manufacturingOrder.service';
import { manufacturingRepository } from '../../../src/repositories/manufacturing.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 063 — ManufacturingService Integration Tests', () => {
  it('getStatusHistory should return status history for manufacturing order', async () => {
    const mockMo = {
      id: 'mo-400',
      organization_id: orgAId,
      order_number: 'MO-400',
      status: 'draft',
    };

    vi.spyOn(manufacturingRepository, 'findById').mockResolvedValueOnce(mockMo as unknown as Awaited<ReturnType<typeof manufacturingRepository.findById>>);
    vi.spyOn(manufacturingRepository, 'listStatusHistory').mockResolvedValueOnce([] as unknown as Awaited<ReturnType<typeof manufacturingRepository.listStatusHistory>>);

    const history = await manufacturingOrderService.getStatusHistory(orgAId, 'mo-400');
    expect(history).toBeDefined();
  });
});
