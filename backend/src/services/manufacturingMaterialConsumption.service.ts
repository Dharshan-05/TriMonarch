import { PoolClient } from 'pg';
import { manufacturingRepository } from '../repositories/manufacturing.repository';
import { manufacturingMaterialConsumptionRepository } from '../repositories/manufacturingMaterialConsumption.repository';
import { inventoryService } from './inventory.service';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import { toDecimal, formatDecimal, compareDecimal, QUANTITY_SCALE } from '../utils/decimal';
import Decimal from 'decimal.js';
import {
  ManufacturingOrderNotFoundError,
  ManufacturingOrderWarehouseNotFoundError,
  ManufacturingOrderNotInProgressError,
  ManufacturingMaterialOverConsumptionError,
  ManufacturingMaterialItemNotFoundError,
  DuplicateManufacturingConsumptionError,
  ManufacturingMaterialConsumptionNotFoundError,
  ValidationError,
} from '../types';
import { ManufacturingMaterialConsumption } from '../types/database';

export interface ConsumeMaterialItemRequest {
  manufacturing_order_item_id: string;
  quantity: string | number;
}

export interface ConsumeMaterialsRequest {
  items: ConsumeMaterialItemRequest[];
  reference_number?: string;
  notes?: string;
}

export interface MaterialConsumptionStatusItem {
  manufacturing_order_item_id: string;
  product_id: string;
  required_quantity: string;
  consumed_quantity: string;
  remaining_quantity: string;
}

export interface ConsumeMaterialsResponse {
  manufacturing_order_id: string;
  status: string;
  material_consumption_complete: boolean;
  items: MaterialConsumptionStatusItem[];
}

export class ManufacturingMaterialConsumptionService {
  async consumeMaterials(
    organizationId: string,
    manufacturingOrderId: string,
    input: ConsumeMaterialsRequest,
    userId?: string,
    requestId?: string,
  ): Promise<ConsumeMaterialsResponse> {
    return withTransaction(async (tx) => {
      // 1. Lock Manufacturing Order FOR UPDATE
      const mo = await manufacturingRepository.lockByIdForUpdate(organizationId, manufacturingOrderId, tx);
      if (!mo) {
        throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
      }

      // 2. Validate MO IN_PROGRESS state & Warehouse
      if (mo.status !== 'in_progress') {
        throw new ManufacturingOrderNotInProgressError(mo.status);
      }
      if (!mo.warehouse_id) {
        throw new ManufacturingOrderWarehouseNotFoundError(`Manufacturing order ${mo.order_number} is missing target warehouse`);
      }

      // 3. Validate Request Items & Duplicate Check
      if (!input.items || input.items.length === 0) {
        throw new ValidationError('Material consumption request must contain at least one item');
      }

      const itemIds = new Set<string>();
      for (const item of input.items) {
        if (itemIds.has(item.manufacturing_order_item_id)) {
          throw new ValidationError(
            `Duplicate manufacturing_order_item_id '${item.manufacturing_order_item_id}' in consumption request`,
          );
        }
        itemIds.add(item.manufacturing_order_item_id);
      }

      // 4. Idempotency Check for reference_number
      if (input.reference_number) {
        const existingRef = await manufacturingMaterialConsumptionRepository.findByReferenceNumber(
          organizationId,
          input.reference_number,
          tx,
        );
        if (existingRef) {
          throw new DuplicateManufacturingConsumptionError(input.reference_number);
        }
      }

      // 5. Process each requested item consumption
      for (const reqItem of input.items) {
        const moItem = await manufacturingRepository.findItemById(
          organizationId,
          reqItem.manufacturing_order_item_id,
          tx,
        );

        if (!moItem || moItem.manufacturing_order_id !== manufacturingOrderId) {
          throw new ManufacturingMaterialItemNotFoundError(reqItem.manufacturing_order_item_id);
        }

        const reqDec = toDecimal(String(moItem.required_quantity));
        const consumedDec = toDecimal(String(moItem.consumed_quantity));
        const remainingDec = Decimal.max(0, reqDec.sub(consumedDec));

        let requestedDec: Decimal;
        try {
          requestedDec = toDecimal(reqItem.quantity);
        } catch {
          throw new ValidationError('Invalid quantity format');
        }

        if (compareDecimal(requestedDec, 0) <= 0) {
          throw new ValidationError('Consumption quantity must be greater than zero');
        }

        if (requestedDec.gt(remainingDec)) {
          throw new ManufacturingMaterialOverConsumptionError({
            required_quantity: formatDecimal(reqDec, QUANTITY_SCALE),
            consumed_quantity: formatDecimal(consumedDec, QUANTITY_SCALE),
            remaining_quantity: formatDecimal(remainingDec, QUANTITY_SCALE),
            requested_quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
            product_id: moItem.component_product_id,
          });
        }

        // 6. Decrease physical inventory & create stock ledger OUT entry in tx
        await inventoryService.decreaseStock(
          {
            organization_id: organizationId,
            product_id: moItem.component_product_id,
            warehouse_id: mo.warehouse_id,
            quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
            reference_type: 'MANUFACTURING_CONSUMPTION',
            reference_id: mo.id,
            notes: input.notes || `Material consumption for MO ${mo.order_number}`,
          },
          userId,
          requestId,
          tx,
        );

        // 7. Insert Manufacturing Material Consumption record
        await manufacturingMaterialConsumptionRepository.create(
          {
            organization_id: organizationId,
            manufacturing_order_id: mo.id,
            manufacturing_order_item_id: moItem.id,
            product_id: moItem.component_product_id,
            warehouse_id: mo.warehouse_id,
            quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
            consumed_by: userId || null,
            reference_number: input.reference_number || null,
            notes: input.notes || null,
          },
          tx,
        );

        // 8. Update consumed_quantity on manufacturing_order_items
        const newConsumedDec = consumedDec.add(requestedDec);
        await manufacturingRepository.updateItem(
          organizationId,
          moItem.id,
          {
            consumed_quantity: formatDecimal(newConsumedDec, QUANTITY_SCALE),
          },
          tx,
        );
      }

      // 9. Record Category A Audit Log
      const isBatch = input.items.length > 1;
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'MANUFACTURING_MATERIAL_CONSUMPTION',
          entity_id: mo.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: isBatch
              ? 'MANUFACTURING_MATERIAL_CONSUMPTION_BATCH_CREATED'
              : 'MANUFACTURING_MATERIAL_CONSUMPTION_CREATED',
            manufacturing_order_id: mo.id,
            warehouse_id: mo.warehouse_id,
            reference_number: input.reference_number || null,
            item_count: input.items.length,
          },
        },
        tx,
      );

      // 10. Check if all items are fully consumed
      const isComplete = await this.isMaterialFullyConsumed(organizationId, mo.id, tx);
      const updatedItems = await manufacturingRepository.listItems(organizationId, mo.id, tx);

      return {
        manufacturing_order_id: mo.id,
        status: mo.status,
        material_consumption_complete: isComplete,
        items: updatedItems.map((i) => {
          const reqD = toDecimal(String(i.required_quantity));
          const conD = toDecimal(String(i.consumed_quantity));
          const remD = Decimal.max(0, reqD.sub(conD));
          return {
            manufacturing_order_item_id: i.id,
            product_id: i.component_product_id,
            required_quantity: formatDecimal(reqD, QUANTITY_SCALE),
            consumed_quantity: formatDecimal(conD, QUANTITY_SCALE),
            remaining_quantity: formatDecimal(remD, QUANTITY_SCALE),
          };
        }),
      };
    });
  }

  async isMaterialFullyConsumed(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const items = await manufacturingRepository.listItems(organizationId, manufacturingOrderId, client);
    if (!items || items.length === 0) return false;

    return items.every((item) => {
      const reqDec = toDecimal(String(item.required_quantity));
      const consumedDec = toDecimal(String(item.consumed_quantity));
      return consumedDec.gte(reqDec);
    });
  }

  async getConsumptionHistory(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ): Promise<ManufacturingMaterialConsumption[]> {
    const mo = await manufacturingRepository.findById(organizationId, manufacturingOrderId, client);
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
    }

    return manufacturingMaterialConsumptionRepository.findByManufacturingOrderId(
      organizationId,
      manufacturingOrderId,
      client,
    );
  }

  async getMaterialConsumptionStatus(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ): Promise<ConsumeMaterialsResponse> {
    const mo = await manufacturingRepository.findById(organizationId, manufacturingOrderId, client);
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
    }

    const items = await manufacturingRepository.listItems(organizationId, manufacturingOrderId, client);
    const isComplete = await this.isMaterialFullyConsumed(organizationId, manufacturingOrderId, client);

    return {
      manufacturing_order_id: mo.id,
      status: mo.status,
      material_consumption_complete: isComplete,
      items: items.map((i) => {
        const reqD = toDecimal(String(i.required_quantity));
        const conD = toDecimal(String(i.consumed_quantity));
        const remD = Decimal.max(0, reqD.sub(conD));
        return {
          manufacturing_order_item_id: i.id,
          product_id: i.component_product_id,
          required_quantity: formatDecimal(reqD, QUANTITY_SCALE),
          consumed_quantity: formatDecimal(conD, QUANTITY_SCALE),
          remaining_quantity: formatDecimal(remD, QUANTITY_SCALE),
        };
      }),
    };
  }

  async getConsumption(
    organizationId: string,
    consumptionId: string,
    client?: PoolClient,
  ): Promise<ManufacturingMaterialConsumption> {
    const consumption = await manufacturingMaterialConsumptionRepository.findById(
      organizationId,
      consumptionId,
      client,
    );
    if (!consumption) {
      throw new ManufacturingMaterialConsumptionNotFoundError(consumptionId);
    }
    return consumption;
  }
}

export const manufacturingMaterialConsumptionService =
  new ManufacturingMaterialConsumptionService();
