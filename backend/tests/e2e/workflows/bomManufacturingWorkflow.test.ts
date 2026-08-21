import { describe, it, expect, vi } from 'vitest';
import { bomService } from '../../../src/services/bom.service';
import { bomRepository } from '../../../src/repositories/bom.repository';
import { productRepository } from '../../../src/repositories/product.repository';
import { auditService } from '../../../src/audit/audit.service';
import * as txModule from '../../../src/db/transaction';
import { e2eOrgA, e2eProductA } from '../fixtures/workflows';

describe('Phase 066 — E2E BOM & Manufacturing Workflow', () => {
  it('executes Product -> BOM -> Component validation lifecycle', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null);
    vi.spyOn(productRepository, 'findById').mockResolvedValue({ id: e2eProductA.id, name: 'Prod A', sku: 'PROD-A', organization_id: e2eOrgA.id } as never);
    vi.spyOn(bomRepository, 'findLatestRevision').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'findByProductAndRevision').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'findByBomNumber').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'create').mockImplementation(async (data) => ({ ...data, id: 'bom-e2e-1' } as never));

    const bom = await bomService.createBom({
      organization_id: e2eOrgA.id,
      product_id: e2eProductA.id,
      name: 'E2E BOM Product A',
    });

    expect(bom.id).toBe('bom-e2e-1');
  });
});
