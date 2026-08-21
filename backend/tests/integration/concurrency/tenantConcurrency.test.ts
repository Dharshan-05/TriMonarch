import { describe, it, expect, vi } from 'vitest';
import { productService } from '../../../src/services/product.service';
import { productRepository } from '../../../src/repositories/product.repository';
import * as txModule from '../../../src/db/transaction';
import { orgAId, orgBId } from './concurrencyFixtures';

describe('Phase 065 — Tenant Isolation Under Concurrency Tests', () => {
  it('simultaneous requests from different tenants do not cause cross-tenant data leakage', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(productRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === 'p-1') return { id: 'p-1', organization_id: orgAId, name: 'Org A Prod' } as never;
      if (orgId === orgBId && id === 'p-2') return { id: 'p-2', organization_id: orgBId, name: 'Org B Prod' } as never;
      return null;
    });

    const [prodA, prodB] = await Promise.all([
      productService.getProductById(orgAId, 'p-1'),
      productService.getProductById(orgBId, 'p-2'),
    ]);

    expect(prodA?.organization_id).toBe(orgAId);
    expect(prodB?.organization_id).toBe(orgBId);
  });
});
