import { describe, it, expect, vi } from 'vitest';
import { productService } from '../../../src/services/product.service';
import { productRepository } from '../../../src/repositories/product.repository';
import { auditService } from '../../../src/audit/audit.service';
import * as txModule from '../../../src/db/transaction';
import { orgAId, orgBId } from './concurrencyFixtures';

describe('Phase 065 — Product Concurrency Tests', () => {
  it('concurrent cross-tenant product creation with identical SKU succeeds', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null);
    vi.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
    vi.spyOn(productRepository, 'create').mockImplementation(async (data) => ({ ...data, id: 'p-1' } as never));

    const reqA = productService.createProduct({ organization_id: orgAId, sku: 'PROD-001', name: 'Prod A' });
    const reqB = productService.createProduct({ organization_id: orgBId, sku: 'PROD-001', name: 'Prod B' });

    const [resA, resB] = await Promise.all([reqA, reqB]);
    expect(resA.sku).toBe('PROD-001');
    expect(resB.sku).toBe('PROD-001');
  });
});
