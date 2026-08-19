import { salesOrderRepository } from '../repositories/salesOrder.repository';
import { customerRepository } from '../repositories/customer.repository';
import { SalesOrder } from '../types/database';
import {
  SalesOrderNotFoundError,
  CustomerNotFoundError,
  InvalidSalesOrderStateTransitionError,
  SalesOrderAlreadyInStateError,
  SalesOrderCannotBeConfirmedError,
  SalesOrderMissingItemsError,
} from '../types';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';

export type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export const ALLOWED_SALES_ORDER_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

export interface SalesOrderStatusInfo {
  id: string;
  order_number: string;
  current_status: SalesOrderStatus;
  allowed_transitions: SalesOrderStatus[];
}

export class SalesOrderStateMachineService {
  /**
   * Checks if a transition from currentStatus to targetStatus is valid.
   */
  public canTransition(currentStatus: SalesOrderStatus, targetStatus: SalesOrderStatus): boolean {
    const allowed = ALLOWED_SALES_ORDER_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Returns list of allowed next statuses for a given current status.
   */
  public getNextAllowedStatuses(currentStatus: SalesOrderStatus): SalesOrderStatus[] {
    return ALLOWED_SALES_ORDER_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Retrieves current status and allowed transitions for a Sales Order.
   */
  async getAvailableTransitions(
    organizationId: string,
    salesOrderId: string,
  ): Promise<SalesOrderStatusInfo> {
    const order = await salesOrderRepository.findById(organizationId, salesOrderId);
    if (!order) {
      throw new SalesOrderNotFoundError(`Sales order with ID ${salesOrderId} not found`);
    }

    const currentStatus = order.status as SalesOrderStatus;
    return {
      id: order.id,
      order_number: order.order_number,
      current_status: currentStatus,
      allowed_transitions: this.getNextAllowedStatuses(currentStatus),
    };
  }

  /**
   * Main transactional state transition execution method.
   * Uses PostgreSQL FOR UPDATE row locking for concurrency safety.
   */
  async transitionSalesOrder(
    organizationId: string,
    salesOrderId: string,
    targetStatus: SalesOrderStatus,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrder> {
    return withTransaction(async (tx) => {
      // 1. Lock Sales Order row FOR UPDATE to prevent race conditions
      const order = await salesOrderRepository.lockByIdForUpdate(organizationId, salesOrderId, tx);
      if (!order) {
        throw new SalesOrderNotFoundError(`Sales order with ID ${salesOrderId} not found`);
      }

      const currentStatus = order.status as SalesOrderStatus;

      // 2. Idempotency check: repeated transition to same status
      if (currentStatus === targetStatus) {
        throw new SalesOrderAlreadyInStateError(
          currentStatus,
          `Sales order ${order.order_number} is already in state '${targetStatus}'`,
        );
      }

      // 3. State machine transition matrix validation
      if (!this.canTransition(currentStatus, targetStatus)) {
        throw new InvalidSalesOrderStateTransitionError(
          currentStatus,
          targetStatus,
          `Cannot transition sales order ${order.order_number} from status '${currentStatus}' to '${targetStatus}'`,
        );
      }

      // 4. Transition-specific business rules validation
      await this.validateTransitionBusinessRules(organizationId, order, targetStatus, tx);

      // 5. Update status in database
      const updated = (await salesOrderRepository.update(
        organizationId,
        salesOrderId,
        { status: targetStatus },
        tx,
      ))!;

      // 6. Record Category A audit event
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'SALES_ORDER',
          entity_id: salesOrderId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'SALES_ORDER_STATUS_TRANSITION',
            sales_order_id: salesOrderId,
            order_number: order.order_number,
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
  async confirmSalesOrder(
    organizationId: string,
    salesOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrder> {
    return this.transitionSalesOrder(organizationId, salesOrderId, 'confirmed', userId, requestId);
  }

  async processSalesOrder(
    organizationId: string,
    salesOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrder> {
    return this.transitionSalesOrder(organizationId, salesOrderId, 'processing', userId, requestId);
  }

  async shipSalesOrder(
    organizationId: string,
    salesOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrder> {
    return this.transitionSalesOrder(organizationId, salesOrderId, 'shipped', userId, requestId);
  }

  async completeSalesOrder(
    organizationId: string,
    salesOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrder> {
    return this.transitionSalesOrder(organizationId, salesOrderId, 'completed', userId, requestId);
  }

  async cancelSalesOrder(
    organizationId: string,
    salesOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrder> {
    return this.transitionSalesOrder(organizationId, salesOrderId, 'cancelled', userId, requestId);
  }

  /**
   * Internal transition business rules validator.
   */
  private async validateTransitionBusinessRules(
    organizationId: string,
    order: SalesOrder,
    targetStatus: SalesOrderStatus,
    tx: Parameters<Parameters<typeof withTransaction>[0]>[0],
  ): Promise<void> {
    if (targetStatus === 'confirmed') {
      // Rule 1: Customer must still exist and belong to organization
      const customer = await customerRepository.findById(organizationId, order.customer_id, tx);
      if (!customer) {
        throw new CustomerNotFoundError(
          `Customer associated with sales order ${order.order_number} not found in organization`,
        );
      }

      // Rule 2: Order must contain at least 1 line item
      const items = await salesOrderRepository.listItems(organizationId, order.id, tx);
      if (!items || items.length === 0) {
        throw new SalesOrderMissingItemsError(
          `Sales order ${order.order_number} cannot be confirmed without line items`,
        );
      }

      // Rule 3: All line items must have valid quantity > 0
      for (const item of items) {
        const qty = parseFloat(String(item.quantity));
        if (isNaN(qty) || qty <= 0) {
          throw new SalesOrderCannotBeConfirmedError(
            `Line item ${item.id} has invalid quantity '${item.quantity}'`,
          );
        }
      }
    }
  }
}

export const salesOrderStateMachineService = new SalesOrderStateMachineService();
