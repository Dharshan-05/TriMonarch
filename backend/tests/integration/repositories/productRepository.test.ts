import { describe, it, expect, vi } from 'vitest';
import { productRepository } from '../../../src/repositories/product.repository';
import { orgAId, orgBId } from '../fixtures/database';
import { createTestProductOrgAData, createTestProductOrgBData } from '../fixtures/products';

describe('Phase 062 — ProductRepository Integration Tests', () => {
  it('productRepository.findBySku should be tenant scoped', async () => {
    const prodA = createTestProductOrgAData({ sku: 'SKU-001' });
    const prodB = createTestProductOrgBData({ sku: 'SKU-001' }); // Same SKU, different org

    vi.spyOn(productRepository, 'findBySku')
      .mockImplementation(async (orgId, sku) => {
        if (orgId === orgAId && sku === 'SKU-001') return prodA as unknown as Awaited<ReturnType<typeof productRepository.findBySku>>;
        if (orgId === orgBId && sku === 'SKU-001') return prodB as unknown as Awaited<ReturnType<typeof productRepository.findBySku>>;
        return null;
      });

    const orgAProduct = await productRepository.findBySku(orgAId, 'SKU-001');
    expect(orgAProduct?.organization_id).toBe(orgAId);

    const orgBProduct = await productRepository.findBySku(orgBId, 'SKU-001');
    expect(orgBProduct?.organization_id).toBe(orgBId);
  });
});
