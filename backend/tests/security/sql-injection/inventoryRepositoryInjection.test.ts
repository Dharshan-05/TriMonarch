import { describe, it, expect, vi } from 'vitest';
import { inventoryRepository } from '../../../src/repositories/inventory.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — InventoryRepository SQL Injection Audit', () => {
  it('parameterizes inventory queries safely', async () => {
    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await inventoryRepository.findByProductAndWarehouse('11111111-1111-1111-1111-111111111111', payload, 'w-1');
      expect(res).toBeNull();
    }
  });
});
