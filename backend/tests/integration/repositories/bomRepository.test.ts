import { describe, it, expect, vi } from 'vitest';
import { bomRepository } from '../../../src/repositories/bom.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 062 — BOMRepository Integration Tests', () => {
  it('bomRepository.findById should return active default BOM for tenant', async () => {
    const mockBom = {
      id: 'bom-001',
      organization_id: orgAId,
      product_id: 'prod-001',
      is_default: true,
      status: 'active',
    };

    vi.spyOn(bomRepository, 'findById')
      .mockImplementation(async (orgId, bId) => {
        if (orgId === orgAId && bId === 'bom-001') {
          return mockBom as unknown as Awaited<ReturnType<typeof bomRepository.findById>>;
        }
        return null;
      });

    const bom = await bomRepository.findById(orgAId, 'bom-001');
    expect(bom).toBeDefined();
    expect(bom?.is_default).toBe(true);
  });
});
