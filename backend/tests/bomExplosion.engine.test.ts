import { describe, it, expect, vi } from 'vitest';
import { bomExplosionEngine, LoadedBomGraphNode } from '../src/services/bomExplosion.engine';
import { toDecimal } from '../src/utils/decimal';
import {
  BomCircularReferenceError,
  BomExplosionMaxDepthError,
} from '../src/types';
import { Bom, BomItem, Product } from '../src/types/database';

describe('BOM Explosion Engine Unit Tests (Phase 032)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';

  const makeProduct = (id: string, sku: string, name: string): Product => ({
    id,
    organization_id: orgId,
    sku,
    name,
    description: null,
    category: null,
    unit: 'pcs',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  });

  const makeBom = (id: string, productId: string, bomNumber: string, revision = '1'): Bom => ({
    id,
    organization_id: orgId,
    product_id: productId,
    bom_number: bomNumber,
    bom_code: bomNumber,
    revision,
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
    sequence = 1,
  ): BomItem => ({
    id,
    organization_id: orgId,
    bom_id: bomId,
    component_product_id: componentProductId,
    quantity,
    unit: 'pcs',
    scrap_percentage: scrapPercentage,
    sequence,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  it('TEST 1: Simple one-level BOM explosion', async () => {
    const table = makeProduct('prod-table', 'TABLE-001', 'Table Assembly');
    const leg = makeProduct('prod-leg', 'LEG-001', 'Table Leg');
    const top = makeProduct('prod-top', 'TOP-001', 'Table Top');

    const bomTable = makeBom('bom-table', 'prod-table', 'BOM-TABLE');
    const itemsTable = [
      makeItem('item-1', 'bom-table', 'prod-leg', '4.0000'),
      makeItem('item-2', 'bom-table', 'prod-top', '1.0000'),
    ];

    const fetcher = vi.fn().mockImplementation(async (pId: string): Promise<LoadedBomGraphNode | null> => {
      if (pId === 'prod-leg') return { bom: null as unknown as Bom, items: [], product: leg };
      if (pId === 'prod-top') return { bom: null as unknown as Bom, items: [], product: top };
      return null;
    });

    const result = await bomExplosionEngine.explode(
      table,
      { ...bomTable, items: itemsTable },
      toDecimal('100'),
      50,
      fetcher,
    );

    expect(result.requested_quantity).toBe('100.0000');
    expect(result.components.length).toBe(2);

    const legComp = result.components.find((c) => c.product_code === 'LEG-001');
    const topComp = result.components.find((c) => c.product_code === 'TOP-001');

    expect(legComp?.required_quantity).toBe('400.0000');
    expect(legComp?.level).toBe(1);
    expect(legComp?.path).toEqual(['TABLE-001', 'LEG-001']);

    expect(topComp?.required_quantity).toBe('100.0000');
    expect(topComp?.level).toBe(1);
    expect(topComp?.path).toEqual(['TABLE-001', 'TOP-001']);
  });

  it('TEST 2 & 3: Multi-level and deep BOM hierarchy (A -> B -> C -> D)', async () => {
    const prodA = makeProduct('prod-a', 'PROD-A', 'Product A');
    const prodB = makeProduct('prod-b', 'PROD-B', 'Product B');
    const prodC = makeProduct('prod-c', 'PROD-C', 'Product C');
    const prodD = makeProduct('prod-d', 'PROD-D', 'Product D');

    const bomA = makeBom('bom-a', 'prod-a', 'BOM-A');
    const itemsA = [makeItem('i-a', 'bom-a', 'prod-b', '2.0000')];

    const bomB = makeBom('bom-b', 'prod-b', 'BOM-B');
    const itemsB = [makeItem('i-b', 'bom-b', 'prod-c', '3.0000')];

    const bomC = makeBom('bom-c', 'prod-c', 'BOM-C');
    const itemsC = [makeItem('i-c', 'bom-c', 'prod-d', '4.0000')];

    const fetcher = vi.fn().mockImplementation(async (pId: string): Promise<LoadedBomGraphNode | null> => {
      if (pId === 'prod-b') return { bom: bomB, items: itemsB, product: prodB };
      if (pId === 'prod-c') return { bom: bomC, items: itemsC, product: prodC };
      if (pId === 'prod-d') return { bom: null as unknown as Bom, items: [], product: prodD };
      return null;
    });

    const result = await bomExplosionEngine.explode(
      prodA,
      { ...bomA, items: itemsA },
      toDecimal('10'),
      50,
      fetcher,
    );

    expect(result.components.length).toBe(3);

    const compB = result.components.find((c) => c.product_code === 'PROD-B');
    const compC = result.components.find((c) => c.product_code === 'PROD-C');
    const compD = result.components.find((c) => c.product_code === 'PROD-D');

    expect(compB?.required_quantity).toBe('20.0000'); // 10 * 2
    expect(compB?.level).toBe(1);

    expect(compC?.required_quantity).toBe('60.0000'); // 20 * 3
    expect(compC?.level).toBe(2);

    expect(compD?.required_quantity).toBe('240.0000'); // 60 * 4
    expect(compD?.level).toBe(3);
    expect(compD?.path).toEqual(['PROD-A', 'PROD-B', 'PROD-C', 'PROD-D']);
  });

  it('TEST 4: Duplicate component aggregation across levels', async () => {
    const prodA = makeProduct('prod-a', 'PROD-A', 'Product A');
    const prodB = makeProduct('prod-b', 'PROD-B', 'Product B');
    const prodC = makeProduct('prod-c', 'PROD-C', 'Product C');

    const bomA = makeBom('bom-a', 'prod-a', 'BOM-A');
    const itemsA = [
      makeItem('i-a1', 'bom-a', 'prod-b', '2.0000'),
      makeItem('i-a2', 'bom-a', 'prod-c', '1.0000'),
      makeItem('i-a3', 'bom-a', 'prod-b', '3.0000'),
    ];

    const fetcher = vi.fn().mockImplementation(async (pId: string): Promise<LoadedBomGraphNode | null> => {
      if (pId === 'prod-b') return { bom: null as unknown as Bom, items: [], product: prodB };
      if (pId === 'prod-c') return { bom: null as unknown as Bom, items: [], product: prodC };
      return null;
    });

    const result = await bomExplosionEngine.explode(
      prodA,
      { ...bomA, items: itemsA },
      toDecimal('10'),
      50,
      fetcher,
    );

    expect(result.components.length).toBe(2);
    const compB = result.components.find((c) => c.product_code === 'PROD-B');
    const compC = result.components.find((c) => c.product_code === 'PROD-C');

    expect(compB?.required_quantity).toBe('50.0000'); // (2 + 3) * 10
    expect(compC?.required_quantity).toBe('10.0000');
  });

  it('TEST 5, 6, 7 & 23: Scrap percentage calculations (0%, 5%, 50%, nested scrap)', async () => {
    const prodA = makeProduct('prod-a', 'PROD-A', 'Product A');
    const prodB = makeProduct('prod-b', 'PROD-B', 'Product B'); // 5% scrap
    const prodC = makeProduct('prod-c', 'PROD-C', 'Product C'); // 50% scrap

    const bomA = makeBom('bom-a', 'prod-a', 'BOM-A');
    const itemsA = [
      makeItem('i-1', 'bom-a', 'prod-b', '2.0000', '5.00'), // 2 * 100 / 0.95 = 210.526315789...
      makeItem('i-2', 'bom-a', 'prod-c', '1.0000', '50.00'), // 1 * 100 / 0.50 = 200.0000
    ];

    const fetcher = vi.fn().mockImplementation(async (pId: string): Promise<LoadedBomGraphNode | null> => {
      if (pId === 'prod-b') return { bom: null as unknown as Bom, items: [], product: prodB };
      if (pId === 'prod-c') return { bom: null as unknown as Bom, items: [], product: prodC };
      return null;
    });

    const result = await bomExplosionEngine.explode(
      prodA,
      { ...bomA, items: itemsA },
      toDecimal('100'),
      50,
      fetcher,
    );

    const compB = result.components.find((c) => c.product_code === 'PROD-B');
    const compC = result.components.find((c) => c.product_code === 'PROD-C');

    expect(compB?.required_quantity).toBe('210.5263');
    expect(compC?.required_quantity).toBe('200.0000');
  });

  it('TEST 8 & 9: Direct & Indirect circular dependency detection', async () => {
    const prodA = makeProduct('prod-a', 'PROD-A', 'Product A');
    const prodB = makeProduct('prod-b', 'PROD-B', 'Product B');
    const prodC = makeProduct('prod-c', 'PROD-C', 'Product C');

    // A -> B -> C -> A
    const bomA = makeBom('bom-a', 'prod-a', 'BOM-A');
    const itemsA = [makeItem('i-a', 'bom-a', 'prod-b', '1.0000')];

    const bomB = makeBom('bom-b', 'prod-b', 'BOM-B');
    const itemsB = [makeItem('i-b', 'bom-b', 'prod-c', '1.0000')];

    const bomC = makeBom('bom-c', 'prod-c', 'BOM-C');
    const itemsC = [makeItem('i-c', 'bom-c', 'prod-a', '1.0000')];

    const fetcher = vi.fn().mockImplementation(async (pId: string): Promise<LoadedBomGraphNode | null> => {
      if (pId === 'prod-b') return { bom: bomB, items: itemsB, product: prodB };
      if (pId === 'prod-c') return { bom: bomC, items: itemsC, product: prodC };
      if (pId === 'prod-a') return { bom: bomA, items: itemsA, product: prodA };
      return null;
    });

    await expect(
      bomExplosionEngine.explode(
        prodA,
        { ...bomA, items: itemsA },
        toDecimal('10'),
        50,
        fetcher,
      ),
    ).rejects.toThrow(BomCircularReferenceError);
  });

  it('TEST 10: Maximum depth protection exceeded', async () => {
    const prodA = makeProduct('prod-a', 'PROD-A', 'Product A');
    const prodB = makeProduct('prod-b', 'PROD-B', 'Product B');
    const prodC = makeProduct('prod-c', 'PROD-C', 'Product C');

    const bomA = makeBom('bom-a', 'prod-a', 'BOM-A');
    const itemsA = [makeItem('i-a', 'bom-a', 'prod-b', '1.0000')];

    const bomB = makeBom('bom-b', 'prod-b', 'BOM-B');
    const itemsB = [makeItem('i-b', 'bom-b', 'prod-c', '1.0000')];

    const fetcher = vi.fn().mockImplementation(async (pId: string): Promise<LoadedBomGraphNode | null> => {
      if (pId === 'prod-b') return { bom: bomB, items: itemsB, product: prodB };
      if (pId === 'prod-c') return { bom: null as unknown as Bom, items: [], product: prodC };
      return null;
    });

    // Set maxDepth to 1 -> level 2 (C) exceeds max depth 1
    await expect(
      bomExplosionEngine.explode(
        prodA,
        { ...bomA, items: itemsA },
        toDecimal('10'),
        1,
        fetcher,
      ),
    ).rejects.toThrow(BomExplosionMaxDepthError);
  });
});
