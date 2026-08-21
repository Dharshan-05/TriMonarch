import { purchaseOrderRepository } from '../repositories/purchaseOrder.repository';
import { PurchaseOrder, PurchaseOrderStatus } from '../types/database';
import {
  PurchaseOrderNotFoundError,
  InvalidPurchaseOrderStateTransitionError,
  PurchaseOrderAlreadyInStateError,
} from '../types';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';

export const ALLOWED_PURCHASE_ORDER_TRANSITIONS: Record<
  PurchaseOrderStatus,
  PurchaseOrderStatus[]
> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['approved', 'cancelled'],
  approved: ['processing', 'partially_received', 'received', 'cancelled'],
  processing: ['partially_received', 'received', 'cancelled'],
  partially_received: ['partially_received', 'received'],
  received: [],
  completed: [],
  cancelled: [],
};

export interface PurchaseOrderStatusInfo {
  id: string;
  order_number: string;
  current_status: PurchaseOrderStatus;
  allowed_transitions: PurchaseOrderStatus[];
}

export class PurchaseOrderStateMachineService {
  /**
   * Checks if a transition from currentStatus to targetStatus is valid.
   */
  public canTransition(
    currentStatus: PurchaseOrderStatus,
    targetStatus: PurchaseOrderStatus,
  ): boolean {
    const allowed = ALLOWED_PURCHASE_ORDER_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Returns list of allowed next statuses for a given current status.
   */
  public getNextAllowedStatuses(currentStatus: PurchaseOrderStatus): PurchaseOrderStatus[] {
    return ALLOWED_PURCHASE_ORDER_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Retrieves current status and allowed transitions for a Purchase Order.
   */
  async getAvailableTransitions(
    organizationId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseOrderStatusInfo> {
    const po = await purchaseOrderRepository.findById(organizationId, purchaseOrderId);
    if (!po) {
      throw new PurchaseOrderNotFoundError(`Purchase order with ID ${purchaseOrderId} not found`);
    }

    const currentStatus = po.status;
    return {
      id: po.id,
      order_number: po.order_number,
      current_status: currentStatus,
      allowed_transitions: this.getNextAllowedStatuses(currentStatus),
    };
  }

  /**
   * Main transactional state transition execution method for Purchase Orders.
   * Uses PostgreSQL FOR UPDATE row locking for concurrency safety.
   */
  async transitionPurchaseOrder(
    organizationId: string,
    purchaseOrderId: string,
    targetStatus: PurchaseOrderStatus,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return withTransaction(async (tx) => {
      // 1. Lock Purchase Order row FOR UPDATE to prevent race conditions
      const po = await purchaseOrderRepository.lockByIdForUpdate(
        organizationId,
        purchaseOrderId,
        tx,
      );
      if (!po) {
        throw new PurchaseOrderNotFoundError(`Purchase order with ID ${purchaseOrderId} not found`);
      }

      const currentStatus = po.status;

      // 2. Idempotency check: repeated transition to same status
      if (currentStatus === targetStatus && currentStatus !== 'partially_received') {
        throw new PurchaseOrderAlreadyInStateError(
          currentStatus,
          `Purchase order ${po.order_number} is already in state '${targetStatus}'`,
        );
      }

      // 3. State machine transition matrix validation
      if (!this.canTransition(currentStatus, targetStatus)) {
        throw new InvalidPurchaseOrderStateTransitionError(
          currentStatus,
          targetStatus,
          `Cannot transition purchase order ${po.order_number} from status '${currentStatus}' to '${targetStatus}'`,
        );
      }

      // 4. Update status in database
      const updated = (await purchaseOrderRepository.update(
        organizationId,
        purchaseOrderId,
        { status: targetStatus },
        tx,
      ))!;

      // 5. Record Category A audit event
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_ORDER',
          entity_id: purchaseOrderId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_ORDER_STATUS_TRANSITION',
            purchase_order_id: purchaseOrderId,
            order_number: po.order_number,
            from_status: currentStatus,
            to_status: targetStatus,
          },
        },
        tx,
      );

      return updated;
    });
  }

  // Convenience shortcuts for specific transitions
  async submitPurchaseOrder(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return this.transitionPurchaseOrder(
      organizationId,
      purchaseOrderId,
      'submitted',
      userId,
      requestId,
    );
  }

  async approvePurchaseOrder(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return this.transitionPurchaseOrder(
      organizationId,
      purchaseOrderId,
      'approved',
      userId,
      requestId,
    );
  }

  async markPartiallyReceived(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return this.transitionPurchaseOrder(
      organizationId,
      purchaseOrderId,
      'partially_received',
      userId,
      requestId,
    );
  }

  async markReceived(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return this.transitionPurchaseOrder(
      organizationId,
      purchaseOrderId,
      'received',
      userId,
      requestId,
    );
  }

  async cancelPurchaseOrder(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return this.transitionPurchaseOrder(
      organizationId,
      purchaseOrderId,
      'cancelled',
      userId,
      requestId,
    );
  }
}

export const purchaseOrderStateMachineService = new PurchaseOrderStateMachineService();
