import { describe, it, expect, vi } from 'vitest';
import { bomExplosionService } from '../src/services/bomExplosion.service';
import { bomRepository } from '../src/repositories/bom.repository';
import { productRepository } from '../src/repositories/product.repository';
import {
  ActiveBomNotFoundError,
  InvalidExplosionQuantityError,
  ProductNotFoundError,
} from '../src/types';
import { Bom, BomItem, Product } from '../src/types/database';

describe('BOM Explosion Service Subsystem (Phase 032)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const parentId = 'prod-parent-1';
  const compId = 'prod-comp-1';

  const mockProductParent: Product = {
    id: parentId,
    organization_id: orgAId,
    sku: 'WIDGET-PARENT',
    name: 'Parent Widget',
    description: null,
    category: null,
    unit: 'pcs',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockProductComp: Product = {
    id: compId,
    organization_id: orgAId,
    sku: 'WIDGET-COMP',
    name: 'Component Bolt',
    description: null,
    category: null,
    unit: 'pcs',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockActiveBom: Bom = {
    id: 'bom-active-1',
    organization_id: orgAId,
    product_id: parentId,
    bom_number: 'BOM-ACTIVE-001',
    bom_code: 'BOM-ACTIVE-001',
    revision: '1',
    version: 1,
    name: 'Active BOM',
    status: 'active',
    effective_from: null,
    effective_to: null,
    is_default: true,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockItem: BomItem = {
    id: 'item-1',
    organization_id: orgAId,
    bom_id: 'bom-active-1',
    component_product_id: compId,
    quantity: '5.0000',
    unit: 'pcs',
    scrap_percentage: '0.00',
    sequence: 1,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('TEST 17, 18, 19: Rejects zero, negative, and invalid decimal quantities', async () => {
    await expect(
      bomExplosionService.explodeBom({
        organization_id: orgAId,
        product_id: parentId,
        quantity: 0,
      }),
    ).rejects.toThrow(InvalidExplosionQuantityError);

    await expect(
      bomExplosionService.explodeBom({
        organization_id: orgAId,
        product_id: parentId,
        quantity: -10,
      }),
    ).rejects.toThrow(InvalidExplosionQuantityError);

    await expect(
      bomExplosionService.explodeBom({
        organization_id: orgAId,
        product_id: parentId,
        quantity: 'invalid-decimal',
      }),
    ).rejects.toThrow(InvalidExplosionQuantityError);
  });

  it('TEST 11: Rejects explosion when product has no active BOM', async () => {
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProductParent);
    vi.spyOn(bomRepository, 'findDefaultBom').mockResolvedValueOnce(null);
    vi.spyOn(bomRepository, 'findByProductId').mockResolvedValueOnce([]);

    await expect(
      bomExplosionService.explodeBom({
        organization_id: orgAId,
        product_id: parentId,
        quantity: 100,
      }),
    ).rejects.toThrow(ActiveBomNotFoundError);
  });

  it('TEST 12 & 13: Rejects explicitly supplied archived or inactive BOMs', async () => {
    const archivedBom: Bom = { ...mockActiveBom, id: 'bom-archived', status: 'archived' };
    const inactiveBom: Bom = { ...mockActiveBom, id: 'bom-inactive', status: 'inactive' };

    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProductParent);

    vi.spyOn(bomRepository, 'findByIdWithComponents').mockResolvedValueOnce({
      ...archivedBom,
      items: [mockItem],
    });
    await expect(
      bomExplosionService.explodeBom({
        organization_id: orgAId,
        product_id: parentId,
        bom_id: 'bom-archived',
        quantity: 10,
      }),
    ).rejects.toThrow(ActiveBomNotFoundError);

    vi.spyOn(bomRepository, 'findByIdWithComponents').mockResolvedValueOnce({
      ...inactiveBom,
      items: [mockItem],
    });
    await expect(
      bomExplosionService.explodeBom({
        organization_id: orgAId,
        product_id: parentId,
        bom_id: 'bom-inactive',
        quantity: 10,
      }),
    ).rejects.toThrow(ActiveBomNotFoundError);
  });

  it('TEST 14 & 15: Explicit and Default BOM Selection', async () => {
    vi.spyOn(productRepository, 'findById').mockImplementation(async (orgId, pId) => {
      if (orgId === orgAId && pId === parentId) return mockProductParent;
      if (orgId === orgAId && pId === compId) return mockProductComp;
      return null;
    });

    vi.spyOn(bomRepository, 'findDefaultBom').mockImplementation(async (orgId, pId) => {
      if (orgId === orgAId && pId === parentId) return mockActiveBom;
      return null;
    });
    vi.spyOn(bomRepository, 'findByIdWithComponents').mockImplementation(async (orgId, bId) => {
      if (orgId === orgAId && bId === 'bom-active-1') return { ...mockActiveBom, items: [mockItem] };
      return null;
    });
    vi.spyOn(bomRepository, 'findByProductId').mockResolvedValue([]);

    // Default selection
    const defaultResult = await bomExplosionService.explodeBom({
      organization_id: orgAId,
      product_id: parentId,
      quantity: 10,
    });
    expect(defaultResult.bom_id).toBe('bom-active-1');
    expect(defaultResult.components[0]?.required_quantity).toBe('50.0000');

    // Explicit selection
    const explicitResult = await bomExplosionService.explodeBom({
      organization_id: orgAId,
      product_id: parentId,
      bom_id: 'bom-active-1',
      quantity: 20,
    });
    expect(explicitResult.bom_id).toBe('bom-active-1');
    expect(explicitResult.components[0]?.required_quantity).toBe('100.0000');
  });

  it('TEST 16: Effective-date BOM Selection', async () => {
    const pastBom: Bom = {
      ...mockActiveBom,
      id: 'bom-past',
      is_default: false,
      effective_from: new Date('2020-01-01'),
      effective_to: new Date('2020-12-31'),
    };
    const validDateBom: Bom = {
      ...mockActiveBom,
      id: 'bom-valid-date',
      is_default: false,
      effective_from: new Date('2025-01-01'),
      effective_to: new Date('2030-12-31'),
    };

    vi.spyOn(productRepository, 'findById').mockImplementation(async (orgId, pId) => {
      if (orgId === orgAId && pId === parentId) return mockProductParent;
      if (orgId === orgAId && pId === compId) return mockProductComp;
      return null;
    });

    vi.spyOn(bomRepository, 'findDefaultBom').mockResolvedValue(null);
    vi.spyOn(bomRepository, 'findByProductId').mockImplementation(async (orgId, pId) => {
      if (orgId === orgAId && pId === parentId) return [pastBom, validDateBom];
      return [];
    });
    vi.spyOn(bomRepository, 'findByIdWithComponents').mockImplementation(async (orgId, bId) => {
      if (orgId === orgAId && bId === 'bom-valid-date') return { ...validDateBom, items: [mockItem] };
      return null;
    });

    const result = await bomExplosionService.explodeBom({
      organization_id: orgAId,
      product_id: parentId,
      quantity: 10,
    });

    expect(result.bom_id).toBe('bom-valid-date');
  });

  it('TEST 20: Tenant Isolation - Org B cannot access Org A product or BOM', async () => {
    vi.spyOn(productRepository, 'findById').mockResolvedValue(null);

    await expect(
      bomExplosionService.explodeBom({
        organization_id: orgBId,
        product_id: parentId,
        quantity: 10,
      }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('TEST 21 & 22: Large production quantity and exact Decimal precision', async () => {
    vi.spyOn(productRepository, 'findById').mockImplementation(async (orgId, pId) => {
      if (orgId === orgAId && pId === parentId) return mockProductParent;
      if (orgId === orgAId && pId === compId) return mockProductComp;
      return null;
    });

    vi.spyOn(bomRepository, 'findDefaultBom').mockImplementation(async (orgId, pId) => {
      if (orgId === orgAId && pId === parentId) return mockActiveBom;
      return null;
    });
    vi.spyOn(bomRepository, 'findByIdWithComponents').mockImplementation(async (orgId, bId) => {
      if (orgId === orgAId && bId === 'bom-active-1') return { ...mockActiveBom, items: [mockItem] };
      return null;
    });

    const result = await bomExplosionService.explodeBom({
      organization_id: orgAId,
      product_id: parentId,
      quantity: 1000000,
    });

    expect(result.requested_quantity).toBe('1000000.0000');
    expect(result.components[0]?.required_quantity).toBe('5000000.0000'); // 1,000,000 * 5
  });
});
