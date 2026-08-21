import { salesDeliveryRepository } from '../repositories/salesDelivery.repository';
import { SalesDelivery, SalesDeliveryStatus } from '../types/database';
import {
  SalesDeliveryNotFoundError,
  InvalidSalesDeliveryStateTransitionError,
  SalesDeliveryAlreadyInStateError,
} from '../types';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';

export const ALLOWED_DELIVERY_TRANSITIONS: Record<SalesDeliveryStatus, SalesDeliveryStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['picking', 'cancelled'],
  picking: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export interface DeliveryStatusInfo {
  id: string;
  delivery_number: string;
  current_status: SalesDeliveryStatus;
  allowed_transitions: SalesDeliveryStatus[];
}

export class SalesDeliveryStateMachineService {
  /**
   * Checks if a transition from currentStatus to targetStatus is valid.
   */
  public canTransition(currentStatus: SalesDeliveryStatus, targetStatus: SalesDeliveryStatus): boolean {
    const allowed = ALLOWED_DELIVERY_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Returns list of allowed next statuses for a given current status.
   */
  public getNextAllowedStatuses(currentStatus: SalesDeliveryStatus): SalesDeliveryStatus[] {
    return ALLOWED_DELIVERY_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Retrieves current status and allowed transitions for a Sales Delivery.
   */
  async getAvailableTransitions(
    organizationId: string,
    deliveryId: string,
  ): Promise<DeliveryStatusInfo> {
    const delivery = await salesDeliveryRepository.getDeliveryById(organizationId, deliveryId);
    if (!delivery) {
      throw new SalesDeliveryNotFoundError(`Sales delivery with ID ${deliveryId} not found`);
    }

    const currentStatus = delivery.status;
    return {
      id: delivery.id,
      delivery_number: delivery.delivery_number,
      current_status: currentStatus,
      allowed_transitions: this.getNextAllowedStatuses(currentStatus),
    };
  }

  /**
   * Main transactional state transition execution method for Sales Deliveries.
   * Uses PostgreSQL FOR UPDATE row locking for concurrency safety.
   */
  async transitionDelivery(
    organizationId: string,
    deliveryId: string,
    targetStatus: SalesDeliveryStatus,
    userId?: string,
    requestId?: string,
    customUpdates?: Record<string, unknown>,
  ): Promise<SalesDelivery> {
    return withTransaction(async (tx) => {
      // 1. Lock Sales Delivery row FOR UPDATE
      const delivery = await salesDeliveryRepository.lockByIdForUpdate(organizationId, deliveryId, tx);
      if (!delivery) {
        throw new SalesDeliveryNotFoundError(`Sales delivery with ID ${deliveryId} not found`);
      }

      const currentStatus = delivery.status;

      // 2. Idempotency check: repeated transition to same status
      if (currentStatus === targetStatus) {
        throw new SalesDeliveryAlreadyInStateError(
          currentStatus,
          `Sales delivery ${delivery.delivery_number} is already in state '${targetStatus}'`,
        );
      }

      // 3. State machine transition matrix validation
      if (!this.canTransition(currentStatus, targetStatus)) {
        throw new InvalidSalesDeliveryStateTransitionError(
          currentStatus,
          targetStatus,
          `Cannot transition sales delivery ${delivery.delivery_number} from status '${currentStatus}' to '${targetStatus}'`,
        );
      }

      // 4. Update status and any custom timestamps (shipped_at, delivered_at, cancelled_at)
      const updateData: Record<string, unknown> = {
        status: targetStatus,
        ...customUpdates,
      };

      if (targetStatus === 'shipped' && !updateData.shipped_at) {
        updateData.shipped_at = new Date();
      }
      if (targetStatus === 'delivered' && !updateData.delivered_at) {
        updateData.delivered_at = new Date();
      }
      if (targetStatus === 'cancelled' && !updateData.cancelled_at) {
        updateData.cancelled_at = new Date();
      }

      const updated = (await salesDeliveryRepository.updateDelivery(
        organizationId,
        deliveryId,
        updateData,
        tx,
      ))!;

      // 5. Record Category A audit event
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'SALES_DELIVERY',
          entity_id: deliveryId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'DELIVERY_STATUS_TRANSITION',
            delivery_id: deliveryId,
            delivery_number: delivery.delivery_number,
            sales_order_id: delivery.sales_order_id,
            from_status: currentStatus,
            to_status: targetStatus,
          },
        },
        tx,
      );

      return updated;
    });
  }
}

export const salesDeliveryStateMachineService = new SalesDeliveryStateMachineService();
