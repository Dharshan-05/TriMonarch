import { purchaseReceiptRepository } from '../repositories/purchaseReceipt.repository';
import { PurchaseReceipt, PurchaseReceiptStatus } from '../types/database';
import {
  PurchaseReceiptNotFoundError,
  InvalidPurchaseReceiptStateTransitionError,
  PurchaseReceiptAlreadyInStateError,
  PurchaseReceiptAlreadyPostedError,
  PurchaseReceiptAlreadyCompletedError,
} from '../types';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';

export const ALLOWED_PURCHASE_RECEIPT_TRANSITIONS: Record<
  PurchaseReceiptStatus,
  PurchaseReceiptStatus[]
> = {
  draft: ['posted', 'cancelled'],
  posted: ['completed'],
  completed: [],
  cancelled: [],
};

export class PurchaseReceiptStateMachineService {
  /**
   * Checks if a transition from currentStatus to targetStatus is valid.
   */
  public canTransition(
    currentStatus: PurchaseReceiptStatus,
    targetStatus: PurchaseReceiptStatus,
  ): boolean {
    const allowed = ALLOWED_PURCHASE_RECEIPT_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Returns list of allowed next statuses for a given current status.
   */
  public getNextAllowedStatuses(currentStatus: PurchaseReceiptStatus): PurchaseReceiptStatus[] {
    return ALLOWED_PURCHASE_RECEIPT_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Main transactional state transition execution method for Purchase Receipts.
   * Uses PostgreSQL FOR UPDATE row locking for concurrency safety.
   */
  async transitionReceipt(
    organizationId: string,
    receiptId: string,
    targetStatus: PurchaseReceiptStatus,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseReceipt> {
    return withTransaction(async (tx) => {
      // 1. Lock Purchase Receipt row FOR UPDATE to prevent race conditions
      const receipt = await purchaseReceiptRepository.lockByIdForUpdate(
        organizationId,
        receiptId,
        tx,
      );
      if (!receipt) {
        throw new PurchaseReceiptNotFoundError(`Purchase receipt with ID ${receiptId} not found`);
      }

      const currentStatus = receipt.status;

      // 2. Idempotency / Double-post / Double-complete checks
      if (currentStatus === targetStatus) {
        if (targetStatus === 'posted') {
          throw new PurchaseReceiptAlreadyPostedError(
            `Purchase receipt ${receipt.receipt_number} is already posted`,
          );
        }
        if (targetStatus === 'completed') {
          throw new PurchaseReceiptAlreadyCompletedError(
            `Purchase receipt ${receipt.receipt_number} is already completed`,
          );
        }
        throw new PurchaseReceiptAlreadyInStateError(
          currentStatus,
          `Purchase receipt ${receipt.receipt_number} is already in state '${targetStatus}'`,
        );
      }

      // 3. State machine transition matrix validation
      if (!this.canTransition(currentStatus, targetStatus)) {
        throw new InvalidPurchaseReceiptStateTransitionError(
          currentStatus,
          targetStatus,
          `Cannot transition purchase receipt ${receipt.receipt_number} from status '${currentStatus}' to '${targetStatus}'`,
        );
      }

      // 4. Update status & timestamp fields in database
      const updateData: Record<string, unknown> = { status: targetStatus };
      if (targetStatus === 'posted') {
        updateData.received_at = new Date();
      } else if (targetStatus === 'cancelled') {
        updateData.cancelled_at = new Date();
      }

      const updated = (await purchaseReceiptRepository.update(
        organizationId,
        receiptId,
        updateData,
        tx,
      ))!;

      // 5. Record Category A audit event
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_RECEIPT',
          entity_id: receiptId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_RECEIPT_STATUS_TRANSITION',
            receipt_id: receiptId,
            receipt_number: receipt.receipt_number,
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

export const purchaseReceiptStateMachineService = new PurchaseReceiptStateMachineService();
