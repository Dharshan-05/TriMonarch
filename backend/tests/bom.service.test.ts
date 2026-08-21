import { describe, it, expect, vi } from 'vitest';
import { bomService } from '../src/services/bom.service';
import { bomRepository } from '../src/repositories/bom.repository';
import { productRepository } from '../src/repositories/product.repository';
import { inventoryService } from '../src/services/inventory.service';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  BomSelfReferenceError,
  BomInvalidQuantityError,
  BomInvalidScrapPercentageError,
  BomImmutableError,
  BomDefaultConflictError,
} from '../src/types';
import { PoolClient } from 'pg';
import { Bom, BomItem, AuditLog } from '../src/types/database';

describe('BOM Service Subsystem (Phase 031)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const parentProdId = '44444444-4444-4444-4444-444444444444';
  const compProd1Id = '55555555-5555-5555-5555-555555555555';
  const compProd2Id = '66666666-6666-6666-6666-666666666666';
  const bomId = '99999999-9999-9999-9999-999999999999';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockParentProduct = {
    id: parentProdId,
    organization_id: orgAId,
    sku: 'PARENT-WIDGET',
    name: 'Parent Widget',
    description: null,
    category: null,
    unit: 'pcs',
    cost_price: '100.0000',
    selling_price: '200.0000',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBom: Bom = {
    id: bomId,
    organization_id: orgAId,
    product_id: parentProdId,
    bom_number: 'BOM-WIDGET-R1',
    bom_code: 'BOM-WIDGET-R1',
    revision: '1',
    version: 1,
    name: 'Widget BOM Rev 1',
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
    bom_id: bomId,
    component_product_id: compProd1Id,
    quantity: '4.0000',
    unit: 'pcs',
    scrap_percentage: '0.00',
    sequence: 1,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('VERIFY INVENTORY SAFETY BOUNDARY: BOM operations DO NOT modify physical stock', async () => {
    const increaseSpy = vi.spyOn(inventoryService, 'increaseStock');
    const decreaseSpy = vi.spyOn(inventoryService, 'decreaseStock');

    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockParentProduct);
    vi.spyOn(bomRepository, 'findByBomNumber').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'findLatestRevision').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'findByProductAndRevision').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'create').mockResolvedValue(mockBom);
    vi.spyOn(bomRepository, 'createComponent').mockResolvedValue(mockItem1);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const created = await bomService.createBom(
      {
        organization_id: orgAId,
        product_id: parentProdId,
        bom_number: 'BOM-WIDGET-R1',
        components: [
          { component_product_id: compProd1Id, quantity: 4, scrap_percentage: 0 },
        ],
      },
      userAId,
    );

    expect(created.status).toBe('draft');
    expect(increaseSpy).not.toHaveBeenCalled();
    expect(decreaseSpy).not.toHaveBeenCalled();
  });

  it('SELF-REFERENCE PROTECTION: throws BomSelfReferenceError if parent is used as component', async () => {
    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockParentProduct);

    await expect(
      bomService.createBom(
        {
          organization_id: orgAId,
          product_id: parentProdId,
          components: [
            { component_product_id: parentProdId, quantity: 1 },
          ],
        },
        userAId,
      ),
    ).rejects.toThrow(BomSelfReferenceError);
  });

  it('QUANTITY VALIDATION: throws BomInvalidQuantityError if quantity <= 0', async () => {
    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockParentProduct);

    await expect(
      bomService.createBom(
        {
          organization_id: orgAId,
          product_id: parentProdId,
          components: [
            { component_product_id: compProd1Id, quantity: 0 },
          ],
        },
        userAId,
      ),
    ).rejects.toThrow(BomInvalidQuantityError);
  });

  it('SCRAP PERCENTAGE VALIDATION: throws BomInvalidScrapPercentageError if scrap < 0 or > 100', async () => {
    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockParentProduct);

    await expect(
      bomService.createBom(
        {
          organization_id: orgAId,
          product_id: parentProdId,
          components: [
            { component_product_id: compProd1Id, quantity: 1, scrap_percentage: 150 },
          ],
        },
        userAId,
      ),
    ).rejects.toThrow(BomInvalidScrapPercentageError);
  });

  it('ACTIVE BOM IMMUTABILITY: rejects component mutation on ACTIVE BOM', async () => {
    const activeBom: Bom = { ...mockBom, status: 'active' };
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(activeBom);

    await expect(
      bomService.addComponent(
        orgAId,
        bomId,
        { component_product_id: compProd2Id, quantity: 5 },
        userAId,
      ),
    ).rejects.toThrow(BomImmutableError);
  });

  it('DEFAULT BOM CONFLICT: setting non-active BOM as default throws BomDefaultConflictError', async () => {
    const draftBom: Bom = { ...mockBom, status: 'draft' };
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(draftBom);

    await expect(bomService.setDefaultBom(orgAId, bomId, userAId)).rejects.toThrow(
      BomDefaultConflictError,
    );
  });

  it('REVISION CREATION: copies components from source BOM into a new DRAFT revision', async () => {
    const activeBom: Bom = { ...mockBom, status: 'active' };
    const newDraftBom: Bom = {
      ...mockBom,
      id: 'bom-rev-2',
      revision: '2',
      version: 2,
      status: 'draft',
    };

    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(activeBom);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockParentProduct);
    vi.spyOn(bomRepository, 'findByProductId').mockResolvedValueOnce([activeBom]);
    vi.spyOn(bomRepository, 'create').mockResolvedValueOnce(newDraftBom);
    vi.spyOn(bomRepository, 'listComponents').mockResolvedValueOnce([mockItem1]);
    vi.spyOn(bomRepository, 'createComponent').mockResolvedValueOnce({
      ...mockItem1,
      id: 'item-2',
      bom_id: newDraftBom.id,
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const rev2 = await bomService.createRevision(orgAId, bomId, userAId);
    expect(rev2.revision).toBe('2');
    expect(rev2.status).toBe('draft');
    expect(rev2.items.length).toBe(1);
  });
});
