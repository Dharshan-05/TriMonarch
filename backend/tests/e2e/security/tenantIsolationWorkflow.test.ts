import { describe, it, expect, vi } from 'vitest';
import { productService } from '../../../src/services/product.service';
import { productRepository } from '../../../src/repositories/product.repository';
import { e2eOrgA, e2eOrgB } from '../fixtures/organizations';

describe('Phase 066 — Multi-Tenant E2E Isolation Workflow', () => {
  it('prevents Tenant A user from accessing Tenant B resources', async () => {
    vi.spyOn(productRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === e2eOrgB.id && id === 'prod-b') return { id: 'prod-b', organization_id: e2eOrgB.id } as never;
      return null;
    });

    await expect(productService.getProductById(e2eOrgA.id, 'prod-b')).rejects.toThrow();
  });
});
