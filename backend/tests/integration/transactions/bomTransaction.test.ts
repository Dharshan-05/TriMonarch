import { describe, it, expect, vi } from 'vitest';
import { bomService } from '../../../src/services/bom.service';
import { bomRepository } from '../../../src/repositories/bom.repository';
import { orgAId } from './transactionFixtures';

describe('Phase 064 — BOM Transaction Rollback Tests', () => {
  it('component creation failure rolls back BOM header insertion', async () => {
    vi.spyOn(bomRepository, 'createItem').mockRejectedValueOnce(new Error('BOM_COMPONENT_FAILURE'));

    await expect(
      bomService.createBom({
        organization_id: orgAId,
        product_id: 'prod-001',
        name: 'Failing BOM',
        components: [
          { component_product_id: 'comp-001', quantity: 2 },
        ],
      }),
    ).rejects.toThrow();
  });
});
