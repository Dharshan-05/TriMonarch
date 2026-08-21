import { bomRepository } from '../repositories/bom.repository';
import { productRepository } from '../repositories/product.repository';
import { bomExplosionEngine, LoadedBomGraphNode } from './bomExplosion.engine';
import {
  Bom,
  BomItem,
  BomExplosionResult,
} from '../types/database';
import { toDecimal, isValidDecimalString } from '../utils/decimal';
import {
  ProductNotFoundError,
  ActiveBomNotFoundError,
  InvalidExplosionQuantityError,
} from '../types';

export interface BomExplosionServiceInput {
  organization_id: string;
  product_id: string;
  quantity: number | string;
  bom_id?: string;
  revision?: string | number;
  max_depth?: number;
}

export class BomExplosionService {
  private async selectActiveBomForProduct(
    organizationId: string,
    productId: string,
    revision?: string | number,
  ): Promise<(Bom & { items: BomItem[] }) | null> {
    const revStr = revision !== undefined ? String(revision).trim() : undefined;

    // 1. If explicit revision requested
    if (revStr) {
      const bom = await bomRepository.findByProductAndRevision(
        organizationId,
        productId,
        revStr,
      );
      if (bom && bom.status === 'active') {
        const full = await bomRepository.findByIdWithComponents(organizationId, bom.id);
        return full;
      }
      return null;
    }

    // 2. Try default active BOM
    const defaultBom = await bomRepository.findDefaultBom(organizationId, productId);
    if (defaultBom && defaultBom.status === 'active') {
      const full = await bomRepository.findByIdWithComponents(organizationId, defaultBom.id);
      if (full) return full;
    }

    // 3. Query active BOMs for product
    const productBoms = await bomRepository.findByProductId(organizationId, productId);
    const activeBoms = productBoms.filter((b) => b.status === 'active');
    if (activeBoms.length === 0) return null;

    const now = new Date();
    // Filter by effective date window
    const validByDate = activeBoms.find((b) => {
      if (b.effective_from && new Date(b.effective_from) > now) return false;
      if (b.effective_to && new Date(b.effective_to) < now) return false;
      return true;
    });

    const chosen = validByDate || activeBoms[0]!;
    return bomRepository.findByIdWithComponents(organizationId, chosen.id);
  }

  async explodeBom(input: BomExplosionServiceInput): Promise<BomExplosionResult> {
    // 1. Validate Quantity
    const qtyStr = String(input.quantity).trim();
    if (typeof input.quantity === 'number' && (isNaN(input.quantity) || !isFinite(input.quantity))) {
      throw new InvalidExplosionQuantityError('Explosion quantity must be a valid finite number');
    }
    if (!isValidDecimalString(qtyStr)) {
      throw new InvalidExplosionQuantityError('Explosion quantity must be a valid numeric decimal');
    }

    const requestedQty = toDecimal(qtyStr);
    if (requestedQty.lte(0)) {
      throw new InvalidExplosionQuantityError(
        'Explosion quantity must be a positive number greater than zero',
      );
    }

    // 2. Validate Root Product
    const rootProduct = await productRepository.findById(input.organization_id, input.product_id);
    if (!rootProduct) {
      throw new ProductNotFoundError(`Product with ID ${input.product_id} not found`);
    }

    // 3. Select Root BOM
    let rootBom: (Bom & { items: BomItem[] }) | null = null;

    if (input.bom_id) {
      const foundBom = await bomRepository.findByIdWithComponents(
        input.organization_id,
        input.bom_id,
      );
      if (!foundBom) {
        throw new ActiveBomNotFoundError(`BOM with ID ${input.bom_id} not found`);
      }
      if (foundBom.status !== 'active') {
        throw new ActiveBomNotFoundError(
          `BOM with ID ${input.bom_id} is not active (status: ${foundBom.status})`,
        );
      }
      if (foundBom.product_id !== input.product_id) {
        throw new ActiveBomNotFoundError(
          `BOM ${input.bom_id} does not belong to product ${input.product_id}`,
        );
      }
      rootBom = foundBom;
    } else {
      rootBom = await this.selectActiveBomForProduct(
        input.organization_id,
        input.product_id,
        input.revision,
      );
      if (!rootBom) {
        throw new ActiveBomNotFoundError(
          `No active BOM found for product '${rootProduct.sku}' (${input.product_id})`,
        );
      }
    }

    // 4. Setup Request-Scoped Cache for Graph Node Loading
    const nodeCache = new Map<string, LoadedBomGraphNode | null>();

    const bomFetcher = async (productId: string): Promise<LoadedBomGraphNode | null> => {
      if (nodeCache.has(productId)) {
        return nodeCache.get(productId)!;
      }

      const product = await productRepository.findById(input.organization_id, productId);
      if (!product) {
        nodeCache.set(productId, null);
        return null;
      }

      const activeBom = await this.selectActiveBomForProduct(
        input.organization_id,
        productId,
      );

      if (!activeBom) {
        const leafNode: LoadedBomGraphNode = {
          bom: null as unknown as Bom,
          items: [],
          product,
        };
        nodeCache.set(productId, leafNode);
        return leafNode;
      }

      const node: LoadedBomGraphNode = {
        bom: activeBom,
        items: activeBom.items,
        product,
      };
      nodeCache.set(productId, node);
      return node;
    };

    const maxDepth = input.max_depth !== undefined ? Number(input.max_depth) : 50;

    // 5. Run Pure Calculation Engine
    return bomExplosionEngine.explode(
      rootProduct,
      rootBom,
      requestedQty,
      maxDepth,
      bomFetcher,
    );
  }
}

export const bomExplosionService = new BomExplosionService();
