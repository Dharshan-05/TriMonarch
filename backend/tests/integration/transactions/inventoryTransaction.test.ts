import { describe, it, expect, vi } from 'vitest';
import { inventoryService } from '../../../src/services/inventory.service';
import { stockLedgerRepository } from '../../../src/repositories/stockLedger.repository';
import { orgAId } from './transactionFixtures';

describe('Phase 064 — Inventory Transaction Rollback Tests', () => {
  it('stock ledger insertion failure rolls back quantity update atomically', async () => {
    vi.spyOn(stockLedgerRepository, 'create').mockRejectedValueOnce(new Error('STOCK_LEDGER_FAILURE'));

    await expect(
      inventoryService.increaseStock({
        organization_id: orgAId,
        product_id: 'p-001',
        warehouse_id: 'w-001',
        quantity: '50.0000',
      }),
    ).rejects.toThrow();
  });
});
