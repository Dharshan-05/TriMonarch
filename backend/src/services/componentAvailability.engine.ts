import { PoolClient } from 'pg';
import { manufacturingRepository } from '../repositories/manufacturing.repository';
import { inventoryRepository } from '../repositories/inventory.repository';
import { stockReservationRepository } from '../repositories/stockReservation.repository';
import { productRepository } from '../repositories/product.repository';
import { toDecimal, formatDecimal, QUANTITY_SCALE } from '../utils/decimal';
import Decimal from 'decimal.js';
import { ManufacturingOrder } from '../types/database';
import {
  ManufacturingOrderNotFoundError,
  ManufacturingOrderWarehouseNotFoundError,
} from '../types';

export interface ComponentAvailabilityItem {
  product_id: string;
  product_code?: string;
  product_name?: string;
  unit_of_measure?: string;
  required_quantity: string;
  on_hand_quantity: string;
  reserved_quantity: string;
  available_quantity: string;
  shortage_quantity: string;
  available: boolean;
}

export interface ManufacturingOrderAvailabilityResult {
  manufacturing_order_id: string;
  warehouse_id: string;
  status: 'READY' | 'SHORTAGE';
  ready: boolean;
  components: ComponentAvailabilityItem[];
  total_components: number;
  available_components: number;
  shortage_components: number;
}

export class ComponentAvailabilityEngine {
  async calculateAvailability(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
    moInput?: ManufacturingOrder,
  ): Promise<ManufacturingOrderAvailabilityResult> {
    // 1. Fetch MO Header if not passed
    const mo = moInput || (await manufacturingRepository.findById(organizationId, manufacturingOrderId, client));
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
    }

    if (!mo.warehouse_id) {
      throw new ManufacturingOrderWarehouseNotFoundError(
        `Manufacturing order ${mo.order_number} is missing a target warehouse_id`,
      );
    }

    // 2. Fetch MO Items
    const items = await manufacturingRepository.listItems(organizationId, manufacturingOrderId, client);
    if (!items || items.length === 0) {
      return {
        manufacturing_order_id: mo.id,
        warehouse_id: mo.warehouse_id,
        status: 'READY',
        ready: true,
        components: [],
        total_components: 0,
        available_components: 0,
        shortage_components: 0,
      };
    }

    // 3. Aggregate Component Requirements by product_id
    const requirementsMap = new Map<string, Decimal>();
    for (const item of items) {
      const currentReq = requirementsMap.get(item.component_product_id) || toDecimal(0);
      const addReq = toDecimal(String(item.required_quantity));
      requirementsMap.set(item.component_product_id, currentReq.add(addReq));
    }

    // 4. Calculate Availability for each aggregated product requirement
    const componentResults: ComponentAvailabilityItem[] = [];

    for (const [productId, requiredDec] of requirementsMap.entries()) {
      // Fetch product info if available
      const product = await productRepository.findById(organizationId, productId, client);

      // Fetch on-hand physical stock for MO.warehouse_id
      const invRecord = await inventoryRepository.findByProductAndWarehouse(
        organizationId,
        productId,
        mo.warehouse_id,
        client,
      );
      const onHandDec = invRecord ? toDecimal(String(invRecord.quantity)) : toDecimal(0);

      // Fetch active reserved stock for MO.warehouse_id
      const reservedStr = await stockReservationRepository.getSumActiveQuantity(
        organizationId,
        productId,
        mo.warehouse_id,
        client,
      );
      const reservedDec = toDecimal(reservedStr);

      // Available stock = max(0, on_hand - reserved)
      const availableDec = Decimal.max(0, onHandDec.sub(reservedDec));

      // Shortage quantity = max(0, required - available)
      const shortageDec = Decimal.max(0, requiredDec.sub(availableDec));

      // Component available boolean
      const isAvailable = availableDec.gte(requiredDec);

      componentResults.push({
        product_id: productId,
        product_code: product?.sku,
        product_name: product?.name,
        unit_of_measure: product?.unit,
        required_quantity: formatDecimal(requiredDec, QUANTITY_SCALE),
        on_hand_quantity: formatDecimal(onHandDec, QUANTITY_SCALE),
        reserved_quantity: formatDecimal(reservedDec, QUANTITY_SCALE),
        available_quantity: formatDecimal(availableDec, QUANTITY_SCALE),
        shortage_quantity: formatDecimal(shortageDec, QUANTITY_SCALE),
        available: isAvailable,
      });
    }

    // 5. Aggregate overall readiness
    const isReady = componentResults.every((c) => c.available);
    const availableCount = componentResults.filter((c) => c.available).length;
    const shortageCount = componentResults.filter((c) => !c.available).length;

    return {
      manufacturing_order_id: mo.id,
      warehouse_id: mo.warehouse_id,
      status: isReady ? 'READY' : 'SHORTAGE',
      ready: isReady,
      components: componentResults,
      total_components: componentResults.length,
      available_components: availableCount,
      shortage_components: shortageCount,
    };
  }
}

export const componentAvailabilityEngine = new ComponentAvailabilityEngine();
