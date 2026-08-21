import { describe, it, expect, vi } from 'vitest';
import { productService } from '../../../src/services/product.service';
import { productRepository } from '../../../src/repositories/product.repository';
import { orgAId, orgBId } from '../fixtures/database';

describe('Phase 063 — ProductService Integration Tests', () => {
  it('getProductBySku should be tenant isolated and support duplicate SKUs across organizations', async () => {
    const prodA = { id: 'p-001', organization_id: orgAId, sku: 'SKU-COMMON-01', name: 'Widget A' };
    const prodB = { id: 'p-002', organization_id: orgBId, sku: 'SKU-COMMON-01', name: 'Widget B' };

    vi.spyOn(productRepository, 'findBySku').mockImplementation(async (orgId, sku) => {
      if (orgId === orgAId && sku === 'SKU-COMMON-01') return prodA as unknown as Awaited<ReturnType<typeof productRepository.findBySku>>;
      if (orgId === orgBId && sku === 'SKU-COMMON-01') return prodB as unknown as Awaited<ReturnType<typeof productRepository.findBySku>>;
      return null;
    });

    const resA = await productService.getProductBySku(orgAId, 'SKU-COMMON-01');
    expect(resA?.organization_id).toBe(orgAId);

    const resB = await productService.getProductBySku(orgBId, 'SKU-COMMON-01');
    expect(resB?.organization_id).toBe(orgBId);
  });
});
