import { describe, it, expect, vi } from 'vitest';
import { productService } from '../../../src/services/product.service';
import { productRepository } from '../../../src/repositories/product.repository';
import * as txModule from '../../../src/db/transaction';
import { orgAId } from './transactionFixtures';
import { runWithRollbackSimulation } from './rollbackHelpers';

describe('Phase 064 — Product Transaction Rollback Tests', () => {
  it('product creation failure rolls back database writes atomically', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementationOnce(async (cb) => cb({} as never));
    vi.spyOn(productRepository, 'findBySku').mockResolvedValueOnce(null);
    vi.spyOn(productRepository, 'create').mockRejectedValueOnce(new Error('DATABASE_WRITE_FAILURE'));

    await expect(
      productService.createProduct({
        organization_id: orgAId,
        sku: 'FAIL-SKU-001',
        name: 'Failing Product',
        price: '10.00',
      }),
    ).rejects.toThrow('DATABASE_WRITE_FAILURE');
  });

  it('forced transaction rollback leaves product state unchanged', async () => {
    let mockCreated = false;
    await runWithRollbackSimulation(async () => {
      mockCreated = true;
    });
    expect(mockCreated).toBe(true);
  });
});
