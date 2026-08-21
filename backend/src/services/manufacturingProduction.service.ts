import { PoolClient } from 'pg';
import { manufacturingRepository } from '../repositories/manufacturing.repository';
import { manufacturingProductionRepository } from '../repositories/manufacturingProduction.repository';
import { manufacturingMaterialConsumptionService } from './manufacturingMaterialConsumption.service';
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
  ManufacturingOrderMaterialsNotFullyConsumedError,
  ManufacturingOrderOverProductionError,
  DuplicateManufacturingProductionError,
  ManufacturingProductionNotFoundError,
  ValidationError,
} from '../types';
import { ManufacturingProduction } from '../types/database';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export interface ProduceFinishedGoodsRequest {
  production_number: string;
  quantity: string | number;
  notes?: string;
}

export interface ProductionStatusResponse {
  manufacturing_order_id: string;
  planned_quantity: string;
  produced_quantity: string;
  remaining_quantity: string;
  production_complete: boolean;
  material_complete: boolean;
  can_produce: boolean;
  status: string;
}

export interface ProduceFinishedGoodsResponse {
  production: ManufacturingProduction;
  manufacturing_order_id: string;
  status: string;
  production_complete: boolean;
  planned_quantity: string;
  produced_quantity: string;
  remaining_quantity: string;
}

export class ManufacturingProductionService {
  async produceFinishedGoods(
    organizationId: string,
    manufacturingOrderId: string,
    input: ProduceFinishedGoodsRequest,
    userId?: string,
    requestId?: string,
  ): Promise<ProduceFinishedGoodsResponse> {
    return withTransaction(async (tx) => {
      // 1. Lock Manufacturing Order FOR UPDATE
      const mo = await manufacturingRepository.lockByIdForUpdate(organizationId, manufacturingOrderId, tx);
      if (!mo) {
        throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
      }

      // 2. Validate MO Status IN_PROGRESS
      if (mo.status !== 'in_progress') {
        throw new ManufacturingOrderNotInProgressError(mo.status);
      }

      // 3. Validate Target Warehouse
      if (!mo.warehouse_id) {
        throw new ManufacturingOrderWarehouseNotFoundError(
          `Manufacturing order ${mo.order_number} is missing target warehouse`,
        );
      }

      // 4. Verify Material Completion Gate (Phase 036)
      const materialsComplete = await manufacturingMaterialConsumptionService.isMaterialFullyConsumed(
        organizationId,
        mo.id,
        tx,
      );
      if (!materialsComplete) {
        throw new ManufacturingOrderMaterialsNotFullyConsumedError(mo.id);
      }

      // 5. Idempotency Check on production_number
      const existing = await manufacturingProductionRepository.findByProductionNumber(
        organizationId,
        input.production_number,
        tx,
      );
      if (existing) {
        throw new DuplicateManufacturingProductionError(input.production_number);
      }

      // 6. Validate Quantities & Remaining Production Capacity
      const plannedDec = toDecimal(String(mo.planned_quantity));
      const currentProducedDec = toDecimal(String(mo.produced_quantity || mo.completed_quantity || '0.0000'));
      const remainingDec = Decimal.max(0, plannedDec.sub(currentProducedDec));

      let requestedDec: Decimal;
      try {
        requestedDec = toDecimal(input.quantity);
      } catch {
        throw new ValidationError('Invalid production quantity format');
      }

      if (compareDecimal(requestedDec, 0) <= 0) {
        throw new ValidationError('Production quantity must be greater than zero');
      }

      if (requestedDec.gt(remainingDec)) {
        throw new ManufacturingOrderOverProductionError({
          planned_quantity: formatDecimal(plannedDec, QUANTITY_SCALE),
          produced_quantity: formatDecimal(currentProducedDec, QUANTITY_SCALE),
          remaining_quantity: formatDecimal(remainingDec, QUANTITY_SCALE),
          requested_quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
          product_id: mo.product_id,
        });
      }

      // 7. Insert Manufacturing Production Record
      const production = await manufacturingProductionRepository.create(
        {
          organization_id: organizationId,
          manufacturing_order_id: mo.id,
          product_id: mo.product_id,
          warehouse_id: mo.warehouse_id,
          production_number: input.production_number,
          quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
          produced_by: userId || null,
          notes: input.notes || null,
        },
        tx,
      );

      // 8. Increase Physical Inventory Balance (Finished Goods IN)
      await inventoryService.increaseStock(
        {
          organization_id: organizationId,
          product_id: mo.product_id,
          warehouse_id: mo.warehouse_id,
          quantity: formatDecimal(requestedDec, QUANTITY_SCALE),
          reference_type: 'MANUFACTURING_PRODUCTION',
          reference_id: production.id,
          notes: input.notes || `Finished goods production ${production.production_number}`,
        },
        userId,
        requestId,
        tx,
      );

      // 9. Update Cumulative Produced & Completed Quantities on MO
      const newProducedDec = currentProducedDec.add(requestedDec);
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

      // 10. Audit Log for Production Posted
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'MANUFACTURING_PRODUCTION',
          entity_id: production.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'MANUFACTURING_PRODUCTION_POSTED',
            production_number: production.production_number,
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

      // 11. Transition MO to COMPLETED when production is fully completed
      let finalStatus: string = mo.status;
      const isComplete = newProducedDec.gte(plannedDec);

      if (isComplete) {
        const transitionResult = await manufacturingOrderStateMachineService.transitionState(
          organizationId,
          mo.id,
          'completed',
          userId,
          `Finished goods production fully completed (${formatDecimal(newProducedDec, QUANTITY_SCALE)} / ${formatDecimal(plannedDec, QUANTITY_SCALE)})`,
          requestId,
          tx,
        );
        finalStatus = transitionResult.status;
      }

      const finalRemaining = Decimal.max(0, plannedDec.sub(newProducedDec));

      return {
        production,
        manufacturing_order_id: mo.id,
        status: finalStatus,
        production_complete: isComplete,
        planned_quantity: formatDecimal(plannedDec, QUANTITY_SCALE),
        produced_quantity: formatDecimal(newProducedDec, QUANTITY_SCALE),
        remaining_quantity: formatDecimal(finalRemaining, QUANTITY_SCALE),
      };
    });
  }

  async getProductionHistory(
    organizationId: string,
    manufacturingOrderId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<ManufacturingProduction>> {
    const mo = await manufacturingRepository.findById(organizationId, manufacturingOrderId, client);
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
    }

    return manufacturingProductionRepository.listByManufacturingOrder(
      organizationId,
      manufacturingOrderId,
      params,
      client,
    );
  }

  async getProductionStatus(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ): Promise<ProductionStatusResponse> {
    const mo = await manufacturingRepository.findById(organizationId, manufacturingOrderId, client);
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order ${manufacturingOrderId} not found`);
    }

    const plannedDec = toDecimal(String(mo.planned_quantity));
    const producedDec = toDecimal(String(mo.produced_quantity || mo.completed_quantity || '0.0000'));
    const remainingDec = Decimal.max(0, plannedDec.sub(producedDec));

    const materialComplete = await manufacturingMaterialConsumptionService.isMaterialFullyConsumed(
      organizationId,
      mo.id,
      client,
    );

    const productionComplete = producedDec.gte(plannedDec);
    const canProduce = mo.status === 'in_progress' && materialComplete && remainingDec.gt(0);

    return {
      manufacturing_order_id: mo.id,
      planned_quantity: formatDecimal(plannedDec, QUANTITY_SCALE),
      produced_quantity: formatDecimal(producedDec, QUANTITY_SCALE),
      remaining_quantity: formatDecimal(remainingDec, QUANTITY_SCALE),
      production_complete: productionComplete,
      material_complete: materialComplete,
      can_produce: canProduce,
      status: mo.status,
    };
  }

  async getProduction(
    organizationId: string,
    productionId: string,
    client?: PoolClient,
  ): Promise<ManufacturingProduction> {
    const prod = await manufacturingProductionRepository.findById(organizationId, productionId, client);
    if (!prod) {
      throw new ManufacturingProductionNotFoundError(productionId);
    }
    return prod;
  }
}

export const manufacturingProductionService = new ManufacturingProductionService();
