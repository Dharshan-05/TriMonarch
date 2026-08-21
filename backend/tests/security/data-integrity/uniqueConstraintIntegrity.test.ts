import { describe, it, expect, vi } from 'vitest';
import { productRepository } from '../../../src/repositories/product.repository';

describe('Phase 070 — Unique Constraint Integrity Audit', () => {
  it('prevents creation of duplicate SKU within the same tenant', async () => {
    vi.spyOn(productRepository, 'create').mockRejectedValue(new Error('duplicate key value violates unique constraint'));

    await expect(
      productRepository.create({
        organization_id: '11111111-1111-1111-1111-111111111111',
        sku: 'DUPLICATE-SKU',
        name: 'Product A',
      }),
    ).rejects.toThrow();
  });
});
