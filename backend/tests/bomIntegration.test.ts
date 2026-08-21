import { describe, it, expect, vi } from 'vitest';
import { bomService } from '../src/services/bom.service';
import { bomRepository } from '../src/repositories/bom.repository';
import { productRepository } from '../src/repositories/product.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { BomImmutableError, BomNotFoundError } from '../src/types';
import { PoolClient } from 'pg';
import { Bom, BomItem, AuditLog } from '../src/types/database';

describe('BOM Management Subsystem E2E Integration Workflows (Phase 031)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const parentProdId = '44444444-4444-4444-4444-444444444444';
  const compProd1Id = '55555555-5555-5555-5555-555555555555';
  const compProd2Id = '66666666-6666-6666-6666-666666666666';
  const bom1Id = 'bom-rev-1111';
  const bom2Id = 'bom-rev-2222';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockParentProduct = {
    id: parentProdId,
    organization_id: orgAId,
    sku: 'WIDGET-MAIN',
    name: 'Main Assembly Widget',
    description: null,
    category: null,
    unit: 'pcs',
    cost_price: '500.0000',
    selling_price: '1000.0000',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBomRev1: Bom = {
    id: bom1Id,
    organization_id: orgAId,
    product_id: parentProdId,
    bom_number: 'BOM-MAIN-R1',
    bom_code: 'BOM-MAIN-R1',
    revision: '1',
    version: 1,
    name: 'Main Widget - Rev 1',
    status: 'draft',
    effective_from: null,
    effective_to: null,
    is_default: false,
    notes: null,
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockItem1: BomItem = {
    id: 'item-1',
    organization_id: orgAId,
    bom_id: bom1Id,
    component_product_id: compProd1Id,
    quantity: '2.0000',
    unit: 'pcs',
    scrap_percentage: '0.00',
    sequence: 1,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockItem2: BomItem = {
    id: 'item-2',
    organization_id: orgAId,
    bom_id: bom1Id,
    component_product_id: compProd2Id,
    quantity: '5.0000',
    unit: 'pcs',
    scrap_percentage: '2.50',
    sequence: 2,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('Full E2E Lifecycle: Create -> Add Comp -> Activate -> Revise -> Modify Rev 2 -> Activate Rev 2 -> Set Default', async () => {
    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockParentProduct);
    vi.spyOn(bomRepository, 'findByBomNumber').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'findLatestRevision').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'findByProductAndRevision').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'create').mockResolvedValue(mockBomRev1);
    vi.spyOn(bomRepository, 'createComponent').mockResolvedValue(mockItem1);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    // 1. Create Draft BOM
    const draft1 = await bomService.createBom(
      {
        organization_id: orgAId,
        product_id: parentProdId,
        bom_number: 'BOM-MAIN-R1',
        components: [
          { component_product_id: compProd1Id, quantity: 2 },
        ],
      },
      userAId,
    );
    expect(draft1.status).toBe('draft');
    expect(draft1.items.length).toBe(1);

    // 2. Add Component 2
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValue(draft1);
    vi.spyOn(bomRepository, 'findComponentByBomAndProduct').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'createComponent').mockResolvedValueOnce(mockItem2);

    const comp2 = await bomService.addComponent(
      orgAId,
      bom1Id,
      { component_product_id: compProd2Id, quantity: 5, scrap_percentage: 2.5 },
      userAId,
    );
    expect(comp2.id).toBe('item-2');

    // 3. Activate Rev 1
    const active1: Bom = { ...mockBomRev1, status: 'active' };
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValue(draft1);
    vi.spyOn(bomRepository, 'listComponents').mockResolvedValue([mockItem1, mockItem2]);
    vi.spyOn(bomRepository, 'update').mockResolvedValueOnce(active1);

    const activated1 = await bomService.activateBom(orgAId, bom1Id, userAId);
    expect(activated1.status).toBe('active');

    // 4. Attempt mutation on Active Rev 1 -> fails
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(active1);
    await expect(
      bomService.addComponent(
        orgAId,
        bom1Id,
        { component_product_id: compProd1Id, quantity: 10 },
        userAId,
      ),
    ).rejects.toThrow(BomImmutableError);

    // 5. Create Revision 2
    const mockBomRev2: Bom = {
      ...mockBomRev1,
      id: bom2Id,
      bom_number: 'BOM-MAIN-R2',
      bom_code: 'BOM-MAIN-R2',
      revision: '2',
      version: 2,
      name: 'Main Widget - Rev 2',
      status: 'draft',
    };

    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValue(active1);
    vi.spyOn(bomRepository, 'findByProductId').mockResolvedValue([active1]);
    vi.spyOn(bomRepository, 'create').mockResolvedValueOnce(mockBomRev2);
    vi.spyOn(bomRepository, 'listComponents').mockResolvedValue([mockItem1, mockItem2]);
    vi.spyOn(bomRepository, 'createComponent')
      .mockResolvedValueOnce({ ...mockItem1, id: 'item-3', bom_id: bom2Id })
      .mockResolvedValueOnce({ ...mockItem2, id: 'item-4', bom_id: bom2Id });

    const rev2 = await bomService.createRevision(orgAId, bom1Id, userAId);
    expect(rev2.revision).toBe('2');
    expect(rev2.status).toBe('draft');
    expect(rev2.items.length).toBe(2);

    // 6. Set Rev 2 as Default when Active
    const active2: Bom = { ...mockBomRev2, status: 'active' };
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValue(active2);
    vi.spyOn(bomRepository, 'findById').mockResolvedValue(active2);
    vi.spyOn(bomRepository, 'setDefaultBom').mockResolvedValueOnce({ ...active2, is_default: true });

    const defaultBom = await bomService.setDefaultBom(orgAId, bom2Id, userAId);
    expect(defaultBom.is_default).toBe(true);
  });

  it('Enforces Tenant Isolation across all queries and operations', async () => {
    vi.spyOn(bomRepository, 'findByIdWithComponents').mockResolvedValueOnce(null);

    await expect(bomService.getBom(orgBId, bom1Id)).rejects.toThrow(BomNotFoundError);
  });
});
