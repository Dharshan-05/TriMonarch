import { describe, it, expect, vi } from 'vitest';
import { bomService } from '../src/services/bom.service';
import { bomRepository } from '../src/repositories/bom.repository';
import { productRepository } from '../src/repositories/product.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { Bom, AuditLog } from '../src/types/database';

describe('BOM Concurrency Control & Atomicity (Phase 031)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const parentProdId = '44444444-4444-4444-4444-444444444444';
  const bom1Id = 'bom-rev-1';
  const bom2Id = 'bom-rev-2';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockParentProduct = {
    id: parentProdId,
    organization_id: orgAId,
    sku: 'WIDGET-CONCURRENCY',
    name: 'Concurrency Widget',
    description: null,
    category: null,
    unit_of_measure: 'PCS',
    cost_price: '100.0000',
    selling_price: '200.0000',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBom1: Bom = {
    id: bom1Id,
    organization_id: orgAId,
    product_id: parentProdId,
    bom_number: 'BOM-CONCURRENCY-1',
    bom_code: 'BOM-CONCURRENCY-1',
    revision: '1',
    version: 1,
    name: 'BOM Rev 1',
    status: 'active',
    effective_from: null,
    effective_to: null,
    is_default: true,
    notes: null,
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBom2: Bom = {
    id: bom2Id,
    organization_id: orgAId,
    product_id: parentProdId,
    bom_number: 'BOM-CONCURRENCY-2',
    bom_code: 'BOM-CONCURRENCY-2',
    revision: '2',
    version: 2,
    name: 'BOM Rev 2',
    status: 'active',
    effective_from: null,
    effective_to: null,
    is_default: false,
    notes: null,
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('CONCURRENT DEFAULT ASSIGNMENT: ensures row locking leaves exactly one default BOM', async () => {
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    // Request 1: set bom1 as default
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockBom1);
    vi.spyOn(bomRepository, 'findById').mockResolvedValueOnce(mockBom1);
    vi.spyOn(bomRepository, 'setDefaultBom').mockResolvedValueOnce({ ...mockBom1, is_default: true });

    const res1 = await bomService.setDefaultBom(orgAId, bom1Id, userAId);
    expect(res1.is_default).toBe(true);

    // Request 2: set bom2 as default concurrently -> unsets bom1, sets bom2
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockBom2);
    vi.spyOn(bomRepository, 'findById').mockResolvedValueOnce(mockBom2);
    vi.spyOn(bomRepository, 'setDefaultBom').mockResolvedValueOnce({ ...mockBom2, is_default: true });

    const res2 = await bomService.setDefaultBom(orgAId, bom2Id, userAId);
    expect(res2.is_default).toBe(true);
    expect(res2.id).toBe(bom2Id);
  });

  it('CONCURRENT REVISION CREATION: ensures unique revision numbers for sequential revision generation', async () => {
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);
    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockParentProduct);
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValue(mockBom1);
    vi.spyOn(bomRepository, 'listComponents').mockResolvedValue([]);

    // Concurrent call 1: sees existing rev ["1"] -> generates Rev 2
    vi.spyOn(bomRepository, 'findByProductId').mockResolvedValueOnce([mockBom1]);
    vi.spyOn(bomRepository, 'create').mockResolvedValueOnce({
      ...mockBom1,
      id: 'bom-rev-2-gen',
      revision: '2',
      status: 'draft',
    });

    const rev2 = await bomService.createRevision(orgAId, bom1Id, userAId);
    expect(rev2.revision).toBe('2');

    // Concurrent call 2: now sees existing revs ["1", "2"] -> generates Rev 3
    vi.spyOn(bomRepository, 'findByProductId').mockResolvedValueOnce([mockBom1, { ...mockBom2, revision: '2' }]);
    vi.spyOn(bomRepository, 'create').mockResolvedValueOnce({
      ...mockBom1,
      id: 'bom-rev-3-gen',
      revision: '3',
      status: 'draft',
    });

    const rev3 = await bomService.createRevision(orgAId, bom1Id, userAId);
    expect(rev3.revision).toBe('3');
  });
});
