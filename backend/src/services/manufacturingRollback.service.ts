import { PoolClient } from 'pg';
import { manufacturingRepository } from '../repositories/manufacturing.repository';
import { manufacturingRollbackRepository } from '../repositories/manufacturingRollback.repository';
import { inventoryService } from './inventory.service';
import { manufacturingOrderStateMachineService } from './manufacturingOrderStateMachine.service';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import { toDecimal, formatDecimal, compareDecimal, QUANTITY_SCALE } from '../utils/decimal';
import Decimal from 'decimal.js';
import {
  ManufacturingOrderNotFoundError,
  ManufacturingOrderWarehouseNotFoundError,
  ManufacturingOrderNotInProgressError,
  ManufacturingMaterialReversalExceedsConsumedError,
  ManufacturingProductionReversalExceedsProducedError,
  ManufacturingOrderCancellationWithActiveProductionError,
  ManufacturingOrderCancellationNotAllowedError,
  DuplicateManufacturingReversalError,
  ManufacturingMaterialItemNotFoundError,
  ValidationError,
} from '../types';
import {
  ManufacturingConsumptionReversal,
  ManufacturingProductionReversal,
  ManufacturingOrder,
} from '../types/database';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export interface ReverseMaterialConsumptionRequest {
  manufacturing_order_item_id: string;
  reversal_number: string;
  quantity: string | number;
  reason?: string;
}

export interface ReverseFinishedGoodsProductionRequest {
  reversal_number: string;
  quantity: string | number;
  reason?: string;
}

export interface ReverseMaterialConsumptionResponse {
  reversal: ManufacturingConsumptionReversal;
  manufacturing_order_id: string;
  manufacturing_order_item_id: string;
  previous_consumed_quantity: string;
  new_consumed_quantity: string;
}

export interface ReverseProductionResponse {
  reversal: ManufacturingProductionReversal;
  manufacturing_order_id: string;
  previous_produced_quantity: string;
  new_produced_quantity: string;
}

export class ManufacturingRollbackService {
  async reverseMaterialConsumption(
    organizationId: string,
    manufacturingOrderId: string,
    input: ReverseMaterialConsumptionRequest,
    userId?: string,
    requestId?: string,
  ): Promise<ReverseMaterialConsumptionResponse> {
    return withTransaction(async (tx) => {
      // 1. Lock MO FOR UPDATE
      const mo = await manufacturingRepository.lockByIdForUpdate(organizationId, manufacturingOrderId, tx);
      if (!mo) {
        throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
      }

      // 2. Validate MO Status IN_PROGRESS
      if (mo.status !== 'in_progress') {
        throw new ManufacturingOrderNotInProgressError(mo.status);
      }

      if (!mo.warehouse_id) {
        throw new ManufacturingOrderWarehouseNotFoundError(`Manufacturing order ${mo.order_number} is missing warehouse`);
      }

      // 3. Idempotency Check
      const existing = await manufacturingRollbackRepository.findConsumptionReversalByNumber(
        organizationId,
        input.reversal_number,
        tx,
      );
      if (existing) {
        throw new DuplicateManufacturingReversalError(input.reversal_number);
      }

      // 4. Fetch MO Item & Validate Reversal Quantity
      const item = await manufacturingRepository.findItemById(
        organizationId,
        input.manufacturing_order_item_id,
        tx,
      );
      if (!item || item.manufacturing_order_id !== manufacturingOrderId) {
        throw new ManufacturingMaterialItemNotFoundError(input.manufacturing_order_item_id);
      }

      const consumedDec = toDecimal(String(item.consumed_quantity));
      let requestedDec: Decimal;
      try {
        requestedDec = toDecimal(input.quantity);
      } catch {
        throw new ValidationError('Invalid reversal quantity format');
      }

      if (compareDecimal(requestedDec, 0) <= 0) {
        throw new ValidationError('Reversal quantity must be greater than zero');
      }

      if (requestedDec.gt(consumedDec)) {
        throw new ManufacturingMaterialReversalExceedsConsumedError(
          formatDecimal(requestedDec, QUANTITY_SCALE),
          formatDecimal(consumedDec, QUANTITY_SCALE),
        );
      }

      // 5. Restore Component Inventory Balance (IN)
      await inventoryService.increaseStock(
        {
          organization_id: organizationId,
          product_id: item.component_product_id,
          warehouse_id: mo.warehouse_id,
          quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
          reference_type: 'MANUFACTURING_CONSUMPTION_REVERSAL',
          reference_id: mo.id,
          notes: input.reason || `Material consumption reversal for MO ${mo.order_number}`,
        },
        userId,
        requestId,
        tx,
      );

      // 6. Record Consumption Reversal
      const reversal = await manufacturingRollbackRepository.createConsumptionReversal(
        {
          organization_id: organizationId,
          manufacturing_order_id: mo.id,
          manufacturing_order_item_id: item.id,
          product_id: item.component_product_id,
          warehouse_id: mo.warehouse_id,
          reversal_number: input.reversal_number,
          quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
          reversed_by: userId || null,
          reason: input.reason || null,
        },
        tx,
      );

      // 7. Update MO Item Consumed Quantity
      const newConsumedDec = consumedDec.sub(requestedDec);
      await manufacturingRepository.updateItem(
        organizationId,
        item.id,
        {
          consumed_quantity: formatDecimal(newConsumedDec, QUANTITY_SCALE),
        },
        tx,
      );

      // 8. Record Audit Event
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'MANUFACTURING_MATERIAL_CONSUMPTION',
          entity_id: mo.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'MANUFACTURING_MATERIAL_CONSUMPTION_REVERSED',
            reversal_number: reversal.reversal_number,
            manufacturing_order_id: mo.id,
            manufacturing_order_item_id: item.id,
            product_id: item.component_product_id,
            warehouse_id: mo.warehouse_id,
            quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
            previous_consumed_quantity: formatDecimal(consumedDec, QUANTITY_SCALE),
            new_consumed_quantity: formatDecimal(newConsumedDec, QUANTITY_SCALE),
          },
        },
        tx,
      );

      return {
        reversal,
        manufacturing_order_id: mo.id,
        manufacturing_order_item_id: item.id,
        previous_consumed_quantity: formatDecimal(consumedDec, QUANTITY_SCALE),
        new_consumed_quantity: formatDecimal(newConsumedDec, QUANTITY_SCALE),
      };
    });
  }

  async reverseFinishedGoodsProduction(
    organizationId: string,
    manufacturingOrderId: string,
    input: ReverseFinishedGoodsProductionRequest,
    userId?: string,
    requestId?: string,
  ): Promise<ReverseProductionResponse> {
    return withTransaction(async (tx) => {
      // 1. Lock MO FOR UPDATE
      const mo = await manufacturingRepository.lockByIdForUpdate(organizationId, manufacturingOrderId, tx);
      if (!mo) {
        throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
      }

      if (mo.status !== 'in_progress' && mo.status !== 'completed') {
        throw new ValidationError(`Production reversal is only allowed in 'in_progress' or 'completed' status (current: '${mo.status}')`);
      }

      if (!mo.warehouse_id) {
        throw new ManufacturingOrderWarehouseNotFoundError(`Manufacturing order ${mo.order_number} is missing warehouse`);
      }

      // 2. Idempotency Check
      const existing = await manufacturingRollbackRepository.findProductionReversalByNumber(
        organizationId,
        input.reversal_number,
        tx,
      );
      if (existing) {
        throw new DuplicateManufacturingReversalError(input.reversal_number);
      }

      // 3. Validate Quantities
      const currentProducedDec = toDecimal(String(mo.produced_quantity || mo.completed_quantity || '0.0000'));
      let requestedDec: Decimal;
      try {
        requestedDec = toDecimal(input.quantity);
      } catch {
        throw new ValidationError('Invalid reversal quantity format');
      }

      if (compareDecimal(requestedDec, 0) <= 0) {
        throw new ValidationError('Reversal quantity must be greater than zero');
      }

      if (requestedDec.gt(currentProducedDec)) {
        throw new ManufacturingProductionReversalExceedsProducedError(
          formatDecimal(requestedDec, QUANTITY_SCALE),
          formatDecimal(currentProducedDec, QUANTITY_SCALE),
        );
      }

      // 4. Reduce Finished Goods Inventory Balance (OUT)
      await inventoryService.decreaseStock(
        {
          organization_id: organizationId,
          product_id: mo.product_id,
          warehouse_id: mo.warehouse_id,
          quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
          reference_type: 'MANUFACTURING_PRODUCTION_REVERSAL',
          reference_id: mo.id,
          notes: input.reason || `Finished goods production reversal for MO ${mo.order_number}`,
        },
        userId,
        requestId,
        tx,
      );

      // 5. Create Production Reversal Record
      const reversal = await manufacturingRollbackRepository.createProductionReversal(
        {
          organization_id: organizationId,
          manufacturing_order_id: mo.id,
          product_id: mo.product_id,
          warehouse_id: mo.warehouse_id,
          reversal_number: input.reversal_number,
          quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
          reversed_by: userId || null,
          reason: input.reason || null,
        },
        tx,
      );

      // 6. Update Cumulative Produced & Completed Quantity on MO
      const newProducedDec = currentProducedDec.sub(requestedDec);
      await manufacturingRepository.update(
        organizationId,
        mo.id,
        {
          produced_quantity: formatDecimal(newProducedDec, QUANTITY_SCALE),
          completed_quantity: formatDecimal(newProducedDec, QUANTITY_SCALE),
          updated_by: userId,
        },
        tx,
      );

      // 7. Audit Log
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'MANUFACTURING_PRODUCTION',
          entity_id: mo.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'MANUFACTURING_PRODUCTION_REVERSED',
            reversal_number: reversal.reversal_number,
            manufacturing_order_id: mo.id,
            product_id: mo.product_id,
            warehouse_id: mo.warehouse_id,
            quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
            previous_produced_quantity: formatDecimal(currentProducedDec, QUANTITY_SCALE),
            new_produced_quantity: formatDecimal(newProducedDec, QUANTITY_SCALE),
          },
        },
        tx,
      );

      return {
        reversal,
        manufacturing_order_id: mo.id,
        previous_produced_quantity: formatDecimal(currentProducedDec, QUANTITY_SCALE),
        new_produced_quantity: formatDecimal(newProducedDec, QUANTITY_SCALE),
      };
    });
  }

  async cancelOrderWithReversal(
    organizationId: string,
    manufacturingOrderId: string,
    reason?: string,
    userId?: string,
    requestId?: string,
  ): Promise<ManufacturingOrder> {
    return withTransaction(async (tx) => {
      // 1. Lock MO FOR UPDATE
      const mo = await manufacturingRepository.lockByIdForUpdate(organizationId, manufacturingOrderId, tx);
      if (!mo) {
        throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
      }

      if (mo.status === 'completed' || mo.status === 'cancelled') {
        throw new ManufacturingOrderCancellationNotAllowedError(mo.status);
      }

      const producedDec = toDecimal(String(mo.produced_quantity || mo.completed_quantity || '0.0000'));
      if (compareDecimal(producedDec, 0) > 0) {
        throw new ManufacturingOrderCancellationWithActiveProductionError(
          mo.id,
          formatDecimal(producedDec, QUANTITY_SCALE),
        );
      }

      // 2. Automatically reverse all active component material consumptions
      const items = await manufacturingRepository.listItems(organizationId, mo.id, tx);
      for (const item of items) {
        const consumedDec = toDecimal(String(item.consumed_quantity));
        if (compareDecimal(consumedDec, 0) > 0) {
          if (!mo.warehouse_id) {
            throw new ManufacturingOrderWarehouseNotFoundError(`Manufacturing order ${mo.order_number} is missing warehouse`);
          }

          // Restore component stock
          await inventoryService.increaseStock(
            {
              organization_id: organizationId,
              product_id: item.component_product_id,
              warehouse_id: mo.warehouse_id,
              quantity: formatDecimal(consumedDec, QUANTITY_SCALE),
              reference_type: 'MANUFACTURING_CONSUMPTION_REVERSAL',
              reference_id: mo.id,
              notes: `Automatic material reversal on MO cancellation for ${mo.order_number}`,
            },
            userId,
            requestId,
            tx,
          );

          // Insert consumption reversal record
          await manufacturingRollbackRepository.createConsumptionReversal(
            {
              organization_id: organizationId,
              manufacturing_order_id: mo.id,
              manufacturing_order_item_id: item.id,
              product_id: item.component_product_id,
              warehouse_id: mo.warehouse_id,
              reversal_number: `REV-CANCEL-${item.id.slice(0, 8)}-${Date.now()}`,
              quantity: formatDecimal(consumedDec, QUANTITY_SCALE),
              reversed_by: userId || null,
              reason: reason || 'Automatic reversal on MO cancellation',
            },
            tx,
          );

          // Zero out consumed_quantity
          await manufacturingRepository.updateItem(
            organizationId,
            item.id,
            { consumed_quantity: '0.0000' },
            tx,
          );
        }
      }

      // 3. Transition State to CANCELLED via State Machine
      const cancelledMo = await manufacturingOrderStateMachineService.transitionState(
        organizationId,
        mo.id,
        'cancelled',
        userId,
        reason || 'Cancelled with material reversal',
        requestId,
        tx,
      );

      // 4. Category A Audit Log
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'MANUFACTURING_ORDER',
          entity_id: mo.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'MANUFACTURING_ORDER_CANCELLED_WITH_REVERSAL',
            manufacturing_order_id: mo.id,
            reason: reason || null,
          },
        },
        tx,
      );

      return cancelledMo;
    });
  }

  async getConsumptionReversals(
    organizationId: string,
    manufacturingOrderId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<ManufacturingConsumptionReversal>> {
    const mo = await manufacturingRepository.findById(organizationId, manufacturingOrderId, client);
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
    }

    return manufacturingRollbackRepository.listConsumptionReversals(
      organizationId,
      manufacturingOrderId,
      params,
      client,
    );
  }

  async getProductionReversals(
    organizationId: string,
    manufacturingOrderId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<ManufacturingProductionReversal>> {
    const mo = await manufacturingRepository.findById(organizationId, manufacturingOrderId, client);
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
    }

    return manufacturingRollbackRepository.listProductionReversals(
      organizationId,
      manufacturingOrderId,
      params,
      client,
    );
  }
}

export const manufacturingRollbackService = new ManufacturingRollbackService();
