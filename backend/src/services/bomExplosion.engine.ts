import Decimal from 'decimal.js';
import {
  Bom,
  BomItem,
  Product,
  ExplodedComponentRequirement,
  BomExplosionResult,
} from '../types/database';
import {
  toDecimal,
  formatDecimal,
  QUANTITY_SCALE,
} from '../utils/decimal';
import {
  BomCircularReferenceError,
  BomExplosionMaxDepthError,
  BomExplosionError,
} from '../types';

export interface LoadedBomGraphNode {
  bom: Bom;
  items: BomItem[];
  product: Product;
}

export type BomFetcherFn = (
  productId: string,
) => Promise<LoadedBomGraphNode | null>;

export interface RawRequirement {
  product_id: string;
  product_code: string;
  product_name: string;
  required_quantity: Decimal;
  unit_of_measure: string;
  source_bom_id: string;
  source_product_id: string;
  level: number;
  path: string[];
}

export class BomExplosionEngine {
  async explode(
    rootProduct: Product,
    rootBom: Bom & { items: BomItem[] },
    requestedQuantity: Decimal,
    maxDepth = 50,
    bomFetcher: BomFetcherFn,
  ): Promise<BomExplosionResult> {
    const rawRequirements: RawRequirement[] = [];
    let maxDepthReached = 0;

    const traverse = async (
      currentProduct: Product,
      currentBom: Bom & { items: BomItem[] },
      parentRequiredQty: Decimal,
      currentLevel: number,
      currentPathSkus: string[],
      visitedProductIds: string[],
    ): Promise<void> => {
      if (currentLevel > maxDepth) {
        throw new BomExplosionMaxDepthError(
          `Maximum BOM explosion depth of ${maxDepth} exceeded`,
        );
      }

      if (currentLevel > maxDepthReached) {
        maxDepthReached = currentLevel;
      }

      for (const item of currentBom.items) {
        const itemQty = toDecimal(item.quantity);
        const baseQty = parentRequiredQty.times(itemQty);
        const scrapPct = toDecimal(item.scrap_percentage || '0.00');

        if (scrapPct.gte(100)) {
          throw new BomExplosionError(
            `Invalid scrap percentage '${scrapPct.toString()}' on component '${item.component_product_id}'`,
          );
        }

        let effectiveQty = baseQty;
        if (scrapPct.gt(0)) {
          const divisor = toDecimal(100).minus(scrapPct);
          effectiveQty = baseQty.times(100).dividedBy(divisor);
        }

        // Fetch component node (BOM + Product)
        const compNode = await bomFetcher(item.component_product_id);
        const compProduct = compNode?.product;
        const compSku = compProduct ? compProduct.sku : item.component_product_id;
        const compName = compProduct ? compProduct.name : `Product ${item.component_product_id}`;
        const compUnit = item.unit || compProduct?.unit || 'pcs';

        // Circular Dependency Check
        if (visitedProductIds.includes(item.component_product_id)) {
          const cyclePath = [...currentPathSkus, compSku];
          throw new BomCircularReferenceError(
            `Circular dependency detected in BOM graph: ${cyclePath.join(' -> ')}`,
          );
        }

        const nextLevel = currentLevel + 1;
        if (nextLevel > maxDepth) {
          throw new BomExplosionMaxDepthError(
            `Maximum BOM explosion depth of ${maxDepth} exceeded`,
          );
        }

        const nextPathSkus = [...currentPathSkus, compSku];

        // Record raw requirement
        rawRequirements.push({
          product_id: item.component_product_id,
          product_code: compSku,
          product_name: compName,
          required_quantity: effectiveQty,
          unit_of_measure: compUnit,
          source_bom_id: currentBom.id,
          source_product_id: currentProduct.id,
          level: nextLevel,
          path: nextPathSkus,
        });

        // If component has an active sub-BOM, explode recursively
        if (compNode && compNode.bom && compNode.items && compNode.items.length > 0) {
          await traverse(
            compNode.product,
            { ...compNode.bom, items: compNode.items },
            effectiveQty,
            nextLevel,
            nextPathSkus,
            [...visitedProductIds, item.component_product_id],
          );
        }
      }
    };

    // Begin recursion at root level 0
    await traverse(
      rootProduct,
      rootBom,
      requestedQuantity,
      0,
      [rootProduct.sku],
      [rootProduct.id],
    );

    // Normalize & Aggregate by product_id
    const aggregatedMap = new Map<string, RawRequirement>();

    for (const req of rawRequirements) {
      const existing = aggregatedMap.get(req.product_id);
      if (!existing) {
        aggregatedMap.set(req.product_id, {
          ...req,
          required_quantity: req.required_quantity,
        });
      } else {
        existing.required_quantity = existing.required_quantity.plus(req.required_quantity);
        if (req.level < existing.level) {
          existing.level = req.level;
          existing.path = req.path;
          existing.source_bom_id = req.source_bom_id;
          existing.source_product_id = req.source_product_id;
        }
      }
    }

    // Format final component requirements
    const components: ExplodedComponentRequirement[] = Array.from(aggregatedMap.values()).map(
      (req) => ({
        product_id: req.product_id,
        product_code: req.product_code,
        product_name: req.product_name,
        required_quantity: formatDecimal(req.required_quantity, QUANTITY_SCALE),
        unit_of_measure: req.unit_of_measure,
        source_bom_id: req.source_bom_id,
        source_product_id: req.source_product_id,
        level: req.level,
        path: req.path,
      }),
    );

    // Deterministic sorting by product_code (SKU)
    components.sort((a, b) => a.product_code.localeCompare(b.product_code));

    return {
      product_id: rootProduct.id,
      product_code: rootProduct.sku,
      product_name: rootProduct.name,
      requested_quantity: formatDecimal(requestedQuantity, QUANTITY_SCALE),
      bom_id: rootBom.id,
      bom_number: rootBom.bom_number,
      bom_revision: rootBom.revision,
      max_depth: maxDepth,
      depth_reached: maxDepthReached,
      components,
    };
  }
}

export const bomExplosionEngine = new BomExplosionEngine();
