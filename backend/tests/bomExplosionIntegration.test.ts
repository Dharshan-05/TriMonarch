import { describe, it, expect, vi } from 'vitest';
import { bomExplosionService } from '../src/services/bomExplosion.service';
import { bomRepository } from '../src/repositories/bom.repository';
import { productRepository } from '../src/repositories/product.repository';
import { inventoryService } from '../src/services/inventory.service';
import { Bom, BomItem, Product } from '../src/types/database';

describe('BOM Explosion Integration & Safety Verification (Phase 032)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';

  const makeProduct = (id: string, sku: string, name: string): Product => ({
    id,
    organization_id: orgAId,
    sku,
    name,
    description: null,
    category: null,
    unit: 'pcs',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  });

  const makeBom = (id: string, productId: string, bomNumber: string): Bom => ({
    id,
    organization_id: orgAId,
    product_id: productId,
    bom_number: bomNumber,
    bom_code: bomNumber,
    revision: '1',
    version: 1,
    name: `BOM ${bomNumber}`,
    status: 'active',
    effective_from: null,
    effective_to: null,
    is_default: true,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const makeItem = (
    id: string,
    bomId: string,
    componentProductId: string,
    quantity: string,
    scrapPercentage = '0.00',
  ): BomItem => ({
    id,
    organization_id: orgAId,
    bom_id: bomId,
    component_product_id: componentProductId,
    quantity,
    unit: 'pcs',
    scrap_percentage: scrapPercentage,
    sequence: 1,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  it('TEST 24 & 25: ABSOLUTE INVENTORY SAFETY BOUNDARY: zero stock or ledger mutations', async () => {
    const increaseSpy = vi.spyOn(inventoryService, 'increaseStock');
    const decreaseSpy = vi.spyOn(inventoryService, 'decreaseStock');
    const adjustSpy = vi.spyOn(inventoryService, 'adjustStock');

    const tableProd = makeProduct('prod-table', 'TABLE', 'Table Assembly');
    const topProd = makeProduct('prod-top', 'TOP', 'Table Top');
    const tableBom = makeBom('bom-table', 'prod-table', 'BOM-TABLE');
    const tableItems = [makeItem('i-1', 'bom-table', 'prod-top', '1.0000')];

    vi.spyOn(productRepository, 'findById').mockImplementation(async (orgId, pId) => {
      if (pId === 'prod-table') return tableProd;
      if (pId === 'prod-top') return topProd;
      return null;
    });

    vi.spyOn(bomRepository, 'findDefaultBom').mockImplementation(async (orgId, pId) => {
      if (pId === 'prod-table') return tableBom;
      return null;
    });

    vi.spyOn(bomRepository, 'findByProductId').mockImplementation(async (orgId, pId) => {
      if (pId === 'prod-table') return [tableBom];
      return [];
    });

    vi.spyOn(bomRepository, 'findByIdWithComponents').mockImplementation(async (orgId, bId) => {
      if (bId === 'bom-table') return { ...tableBom, items: tableItems };
      return null;
    });

    const result = await bomExplosionService.explodeBom({
      organization_id: orgAId,
      product_id: 'prod-table',
      quantity: 100,
    });

    expect(result.components.length).toBe(1);
    expect(result.components[0]?.required_quantity).toBe('100.0000');

    // VERIFY ZERO INVENTORY MUTATION
    expect(increaseSpy).not.toHaveBeenCalled();
    expect(decreaseSpy).not.toHaveBeenCalled();
    expect(adjustSpy).not.toHaveBeenCalled();
  });

  it('TEST 25: Realistic multi-level table assembly explosion scenario', async () => {
    // Products
    const prodTable = makeProduct('prod-table', 'TABLE', 'Dining Table');
    const prodTop = makeProduct('prod-top', 'TOP', 'Wood Top');
    const prodLeg = makeProduct('prod-leg', 'LEG', 'Metal Leg');
    const prodScrew = makeProduct('prod-screw', 'SCREW', 'M6 Screw');
    const prodCap = makeProduct('prod-cap', 'RUBBER_CAP', 'Rubber Cap');
    const prodRubber = makeProduct('prod-rubber', 'RUBBER', 'Raw Rubber Material');

    // BOMs
    const bomTable = makeBom('bom-table', 'prod-table', 'BOM-TABLE');
    const itemsTable = [
      makeItem('it-1', 'bom-table', 'prod-top', '1.0000'),
      makeItem('it-2', 'bom-table', 'prod-leg', '4.0000'),
      makeItem('it-3', 'bom-table', 'prod-screw', '8.0000'),
    ];

    const bomLeg = makeBom('bom-leg', 'prod-leg', 'BOM-LEG');
    const itemsLeg = [makeItem('il-1', 'bom-leg', 'prod-cap', '1.0000')];

    const bomCap = makeBom('bom-cap', 'prod-cap', 'BOM-CAP');
    const itemsCap = [makeItem('ic-1', 'bom-cap', 'prod-rubber', '0.1000')];

    const productsMap = new Map<string, Product>([
      ['prod-table', prodTable],
      ['prod-top', prodTop],
      ['prod-leg', prodLeg],
      ['prod-screw', prodScrew],
      ['prod-cap', prodCap],
      ['prod-rubber', prodRubber],
    ]);

    const bomsMap = new Map<string, { bom: Bom; items: BomItem[] }>([
      ['prod-table', { bom: bomTable, items: itemsTable }],
      ['prod-leg', { bom: bomLeg, items: itemsLeg }],
      ['prod-cap', { bom: bomCap, items: itemsCap }],
    ]);

    vi.spyOn(productRepository, 'findById').mockImplementation(async (orgId, pId) => {
      return productsMap.get(pId) || null;
    });

    vi.spyOn(bomRepository, 'findDefaultBom').mockImplementation(async (orgId, pId) => {
      const entry = bomsMap.get(pId);
      return entry ? entry.bom : null;
    });

    vi.spyOn(bomRepository, 'findByProductId').mockImplementation(async (orgId, pId) => {
      const entry = bomsMap.get(pId);
      return entry ? [entry.bom] : [];
    });

    vi.spyOn(bomRepository, 'findByIdWithComponents').mockImplementation(async (orgId, bId) => {
      for (const entry of bomsMap.values()) {
        if (entry.bom.id === bId) return { ...entry.bom, items: entry.items };
      }
      return null;
    });

    const result = await bomExplosionService.explodeBom({
      organization_id: orgAId,
      product_id: 'prod-table',
      quantity: 100,
    });

    expect(result.product_code).toBe('TABLE');
    expect(result.requested_quantity).toBe('100.0000');

    // Expected Output:
    // TOP = 100
    // LEG = 400
    // SCREW = 800
    // RUBBER_CAP = 400
    // RUBBER = 40 (400 * 0.1)

    const topComp = result.components.find((c) => c.product_code === 'TOP');
    const legComp = result.components.find((c) => c.product_code === 'LEG');
    const screwComp = result.components.find((c) => c.product_code === 'SCREW');
    const capComp = result.components.find((c) => c.product_code === 'RUBBER_CAP');
    const rubberComp = result.components.find((c) => c.product_code === 'RUBBER');

    expect(topComp?.required_quantity).toBe('100.0000');
    expect(legComp?.required_quantity).toBe('400.0000');
    expect(screwComp?.required_quantity).toBe('800.0000');
    expect(capComp?.required_quantity).toBe('400.0000');
    expect(rubberComp?.required_quantity).toBe('40.0000');

    // Check tree path representation
    expect(rubberComp?.path).toEqual(['TABLE', 'LEG', 'RUBBER_CAP', 'RUBBER']);
    expect(rubberComp?.level).toBe(3);
  });
});
