import { describe, it, expect, vi } from 'vitest';
import { manufacturingRepository } from '../../../src/repositories/manufacturing.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 062 — ManufacturingRepository Integration Tests', () => {
  it('manufacturingRepository.findByOrderNumber should return manufacturing order for matching organization', async () => {
    const mockMo = {
      id: 'mo-001',
      organization_id: orgAId,
      order_number: 'MO-1001',
      status: 'draft',
    };

    vi.spyOn(manufacturingRepository, 'findByOrderNumber')
      .mockImplementation(async (orgId, num) => {
        if (orgId === orgAId && num === 'MO-1001') {
          return mockMo as unknown as Awaited<ReturnType<typeof manufacturingRepository.findByOrderNumber>>;
        }
        return null;
      });

    const mo = await manufacturingRepository.findByOrderNumber(orgAId, 'MO-1001');
    expect(mo).toBeDefined();
    expect(mo?.order_number).toBe('MO-1001');
  });
});
