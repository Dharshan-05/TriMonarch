import { PoolClient } from 'pg';
import { manufacturingRepository } from '../repositories/manufacturing.repository';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import { ManufacturingOrder, ManufacturingOrderStatus } from '../types/database';
import {
  ManufacturingOrderNotFoundError,
  InvalidManufacturingOrderStateTransitionError,
  ManufacturingOrderAlreadyInStateError,
  ManufacturingOrderTerminalStateError,
  ManufacturingOrderMissingComponentsError,
  InvalidManufacturingOrderQuantityError,
  ManufacturingOrderCancellationNotAllowedError,
  ManufacturingOrderComponentShortageError,
  ManufacturingOrderProductionIncompleteError,
  ManufacturingOrderCancellationWithActiveProductionError,
} from '../types';
import { componentAvailabilityService } from './componentAvailability.service';
import { toDecimal, formatDecimal, compareDecimal, QUANTITY_SCALE } from '../utils/decimal';

export interface TransitionGuardContext {
  organizationId: string;
  mo: ManufacturingOrder;
  targetStatus: ManufacturingOrderStatus;
  client?: PoolClient;
  userId?: string;
  reason?: string;
}

export type TransitionGuard = (context: TransitionGuardContext) => Promise<void>;

export class ManufacturingOrderStateMachineService {
  private readonly allowedTransitions: Record<
    ManufacturingOrderStatus,
    ManufacturingOrderStatus[]
  > = {
    draft: ['confirmed', 'cancelled'],
    confirmed: ['planned', 'cancelled'],
    planned: ['released', 'cancelled'],
    released: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  private readonly terminalStates: Set<ManufacturingOrderStatus> = new Set(['completed', 'cancelled']);

  private readonly guards: Map<ManufacturingOrderStatus, TransitionGuard[]> = new Map();

  constructor() {
    this.registerDefaultGuards();
  }

  public registerGuard(targetStatus: ManufacturingOrderStatus, guard: TransitionGuard): void {
    const existing = this.guards.get(targetStatus) || [];
    existing.push(guard);
    this.guards.set(targetStatus, existing);
  }

  private registerDefaultGuards(): void {
    // Guard for CONFIRMED state
    this.registerGuard('confirmed', async (ctx) => {
      const items = await manufacturingRepository.listItems(ctx.organizationId, ctx.mo.id, ctx.client);
      if (!items || items.length === 0) {
        throw new ManufacturingOrderMissingComponentsError(
          `Manufacturing order ${ctx.mo.order_number} has no component requirements`,
        );
      }
      const plannedQty = toDecimal(String(ctx.mo.planned_quantity));
      if (plannedQty.lte(0)) {
        throw new InvalidManufacturingOrderQuantityError(
          `Planned quantity must be greater than 0 for MO ${ctx.mo.order_number}`,
        );
      }
    });

    // Guard for PLANNED state
    this.registerGuard('planned', async (ctx) => {
      const items = await manufacturingRepository.listItems(ctx.organizationId, ctx.mo.id, ctx.client);
      if (!items || items.length === 0) {
        throw new ManufacturingOrderMissingComponentsError(
          `Manufacturing order ${ctx.mo.order_number} has no component snapshot`,
        );
      }
    });

    // Guard for RELEASED state (Phase 035 Integration Hook)
    this.registerGuard('released', async (_ctx) => {
      // Phase 035 hook: Component availability validation will be attached here
    });

    // Guard for IN_PROGRESS state (Phase 035 Integration: Material Readiness Guard)
    this.registerGuard('in_progress', async (ctx) => {
      const availability = await componentAvailabilityService.checkManufacturingOrderAvailability(
        ctx.organizationId,
        ctx.mo.id,
        ctx.client,
        ctx.mo,
      );

      if (!availability.ready) {
        const shortages = availability.components.filter((c) => !c.available);
        throw new ManufacturingOrderComponentShortageError(ctx.mo.id, shortages);
      }
    });

    // Guard for COMPLETED state (Phase 037 Finished Goods Production Guard)
    this.registerGuard('completed', async (ctx) => {
      const plannedDec = toDecimal(String(ctx.mo.planned_quantity));
      const producedDec = toDecimal(String(ctx.mo.produced_quantity || ctx.mo.completed_quantity || '0.0000'));

      if (producedDec.lt(plannedDec)) {
        throw new ManufacturingOrderProductionIncompleteError({
          planned_quantity: formatDecimal(plannedDec, QUANTITY_SCALE),
          produced_quantity: formatDecimal(producedDec, QUANTITY_SCALE),
          remaining_quantity: formatDecimal(plannedDec.sub(producedDec), QUANTITY_SCALE),
        });
      }
    });

    // Guard for CANCELLED state (Phase 038 Atomic Rollback & Cancellation Guard)
    this.registerGuard('cancelled', async (ctx) => {
      if (this.terminalStates.has(ctx.mo.status)) {
        throw new ManufacturingOrderCancellationNotAllowedError(ctx.mo.status);
      }
      const producedDec = toDecimal(String(ctx.mo.produced_quantity || ctx.mo.completed_quantity || '0.0000'));
      if (compareDecimal(producedDec, 0) > 0) {
        throw new ManufacturingOrderCancellationWithActiveProductionError(
          ctx.mo.id,
          formatDecimal(producedDec, QUANTITY_SCALE),
        );
      }
    });
  }

  public canTransition(
    currentStatus: ManufacturingOrderStatus,
    targetStatus: ManufacturingOrderStatus,
  ): boolean {
    if (currentStatus === targetStatus) return false;
    if (this.terminalStates.has(currentStatus)) return false;
    const allowed = this.allowedTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  public assertValidTransition(
    currentStatus: ManufacturingOrderStatus,
    targetStatus: ManufacturingOrderStatus,
  ): void {
    if (currentStatus === targetStatus) {
      throw new ManufacturingOrderAlreadyInStateError(targetStatus);
    }
    if (this.terminalStates.has(currentStatus)) {
      throw new ManufacturingOrderTerminalStateError(currentStatus);
    }
    if (!this.canTransition(currentStatus, targetStatus)) {
      if (targetStatus === 'cancelled') {
        throw new ManufacturingOrderCancellationNotAllowedError(currentStatus);
      }
      throw new InvalidManufacturingOrderStateTransitionError(currentStatus, targetStatus);
    }
  }

  async transitionState(
    organizationId: string,
    id: string,
    targetStatus: ManufacturingOrderStatus,
    userId?: string,
    reason?: string,
    requestId?: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrder> {
    const execute = async (tx: PoolClient) => {
      // 1. Lock MO FOR UPDATE
      const mo = await manufacturingRepository.lockByIdForUpdate(organizationId, id, tx);
      if (!mo) {
        throw new ManufacturingOrderNotFoundError(`Manufacturing order with ID ${id} not found`);
      }

      // 2. Assert State Graph Invariants
      this.assertValidTransition(mo.status, targetStatus);

      // 3. Execute Transition Precondition Guards
      const context: TransitionGuardContext = {
        organizationId,
        mo,
        targetStatus,
        client: tx,
        userId,
        reason,
      };

      const targetGuards = this.guards.get(targetStatus) || [];
      for (const guard of targetGuards) {
        await guard(context);
      }

      // 4. Build Update Payload with Lifecycle Timestamps
      const updatePayload: Record<string, unknown> = {
        status: targetStatus,
        updated_by: userId || null,
      };

      if (targetStatus === 'in_progress' && !mo.actual_start_date) {
        updatePayload.actual_start_date = new Date();
      }
      if (targetStatus === 'completed' && !mo.actual_end_date) {
        updatePayload.actual_end_date = new Date();
      }

      // 5. Update MO Record in DB
      const updated = (await manufacturingRepository.update(
        organizationId,
        id,
        updatePayload,
        tx,
      ))!;

      // 6. Insert Immutable Status History Record in Same Transaction
      await manufacturingRepository.createStatusHistory(
        {
          organization_id: organizationId,
          manufacturing_order_id: id,
          from_status: mo.status,
          to_status: targetStatus,
          changed_by: userId || null,
          reason: reason || null,
          request_id: requestId || null,
          metadata: {
            mo_number: updated.order_number,
            product_id: updated.product_id,
            warehouse_id: updated.warehouse_id,
            planned_quantity: updated.planned_quantity,
          },
        },
        tx,
      );

      // 7. Map Audit Action and Record Category A Audit Log Event in Same Transaction
      let auditEventName = 'MANUFACTURING_ORDER_UPDATED';
      switch (targetStatus) {
        case 'confirmed':
          auditEventName = 'MANUFACTURING_ORDER_CONFIRMED';
          break;
        case 'planned':
          auditEventName = 'MANUFACTURING_ORDER_PLANNED';
          break;
        case 'released':
          auditEventName = 'MANUFACTURING_ORDER_RELEASED';
          break;
        case 'in_progress':
          auditEventName = 'MANUFACTURING_ORDER_STARTED';
          break;
        case 'completed':
          auditEventName = 'MANUFACTURING_ORDER_COMPLETED';
          break;
        case 'cancelled':
          auditEventName = 'MANUFACTURING_ORDER_CANCELLED';
          break;
      }

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'MANUFACTURING_ORDER',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            event: auditEventName,
            manufacturing_order_id: id,
            mo_number: updated.order_number,
            product_id: updated.product_id,
            bom_id: updated.bom_id,
            warehouse_id: updated.warehouse_id,
            from_status: mo.status,
            to_status: targetStatus,
            planned_quantity: updated.planned_quantity,
            reason: reason || null,
          },
        },
        tx,
      );

      return updated;
    };

    if (client) {
      return execute(client);
    }
    return withTransaction(execute);
  }
}

export const manufacturingOrderStateMachineService =
  new ManufacturingOrderStateMachineService();
