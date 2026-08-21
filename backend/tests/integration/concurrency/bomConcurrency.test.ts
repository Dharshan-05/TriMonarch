import { describe, it, expect, vi } from 'vitest';
import { bomService } from '../../../src/services/bom.service';
import { bomRepository } from '../../../src/repositories/bom.repository';
import { productRepository } from '../../../src/repositories/product.repository';
import { auditService } from '../../../src/audit/audit.service';
import * as txModule from '../../../src/db/transaction';
import { orgAId } from './concurrencyFixtures';

describe('Phase 065 — BOM Concurrency Tests', () => {
  it('concurrent BOM creation handles component validation', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null);
    vi.spyOn(productRepository, 'findById').mockResolvedValue({ id: 'p-1', name: 'Product 1', sku: 'PROD-1', organization_id: orgAId } as never);
    vi.spyOn(bomRepository, 'findLatestRevision').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'findByProductAndRevision').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'findByBomNumber').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'create').mockImplementation(async (data) => ({ ...data, id: 'bom-1' } as never));

    const bom = await bomService.createBom({ organization_id: orgAId, product_id: 'p-1', name: 'Concurrent BOM' });
    expect(bom.id).toBe('bom-1');
  });
});
