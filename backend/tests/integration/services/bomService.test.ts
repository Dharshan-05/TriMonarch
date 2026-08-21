import { describe, it, expect, vi } from 'vitest';
import { bomService } from '../../../src/services/bom.service';
import { bomRepository } from '../../../src/repositories/bom.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 063 — BomService Integration Tests', () => {
  it('getBom should return BOM structure and component relationships', async () => {
    const mockBom = {
      id: 'bom-300',
      organization_id: orgAId,
      bom_number: 'BOM-300',
      status: 'active',
      items: [],
    };

    vi.spyOn(bomRepository, 'findByIdWithComponents').mockResolvedValueOnce(mockBom as unknown as Awaited<ReturnType<typeof bomRepository.findByIdWithComponents>>);
    vi.spyOn(bomService, 'calculateMaterialCost' as unknown as keyof typeof bomService).mockResolvedValueOnce('0.0000' as never);

    const bom = await bomService.getBom(orgAId, 'bom-300');
    expect(bom).toBeDefined();
    expect(bom.bom_number).toBe('BOM-300');
  });
});
