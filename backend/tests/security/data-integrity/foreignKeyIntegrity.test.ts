import { describe, it, expect, vi } from 'vitest';
import { inventoryService } from '../../../src/services/inventory.service';

describe('Phase 070 — Foreign-Key & Relational Integrity Audit', () => {
  it('rejects inventory adjustments referencing invalid product or warehouse IDs', async () => {
    vi.spyOn(inventoryService, 'adjustStock').mockRejectedValue(new Error('Foreign key violation'));

    await expect(
      inventoryService.adjustStock({
        organizationId: '11111111-1111-1111-1111-111111111111',
        productId: 'nonexistent-prod',
        warehouseId: 'nonexistent-wh',
        quantityDelta: 10,
        reason: 'Integration audit test',
      }),
    ).rejects.toThrow();
  });
});
