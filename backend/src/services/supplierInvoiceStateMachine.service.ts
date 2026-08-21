import { supplierInvoiceRepository } from '../repositories/supplierInvoice.repository';
import { SupplierInvoice, SupplierInvoiceStatus } from '../types/database';
import {
  SupplierInvoiceNotFoundError,
  InvalidSupplierInvoiceStateTransitionError,
  SupplierInvoiceAlreadyInStateError,
  InvoiceAlreadyPaidError,
  InvoiceCancelledError,
} from '../types';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import { compareDecimal } from '../utils/decimal';

export const ALLOWED_SUPPLIER_INVOICE_TRANSITIONS: Record<
  SupplierInvoiceStatus,
  SupplierInvoiceStatus[]
> = {
  draft: ['posted', 'cancelled'],
  posted: ['partially_paid', 'paid', 'cancelled'],
  partially_paid: ['paid'],
  paid: [],
  cancelled: [],
};

export class SupplierInvoiceStateMachineService {
  /**
   * Validates if transition from currentStatus to targetStatus is permitted.
   */
  public canTransition(
    currentStatus: SupplierInvoiceStatus,
    targetStatus: SupplierInvoiceStatus,
  ): boolean {
    const allowed = ALLOWED_SUPPLIER_INVOICE_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Main transactional state transition method for Supplier Invoices.
   * Uses FOR UPDATE row locking for concurrency protection.
   */
  async transitionInvoice(
    organizationId: string,
    invoiceId: string,
    targetStatus: SupplierInvoiceStatus,
    userId?: string,
    requestId?: string,
  ): Promise<SupplierInvoice> {
    return withTransaction(async (tx) => {
      const invoice = await supplierInvoiceRepository.lockByIdForUpdate(
        organizationId,
        invoiceId,
        tx,
      );
      if (!invoice) {
        throw new SupplierInvoiceNotFoundError(`Supplier invoice with ID ${invoiceId} not found`);
      }

      const currentStatus = invoice.status;

      if (currentStatus === targetStatus) {
        throw new SupplierInvoiceAlreadyInStateError(
          currentStatus,
          `Supplier invoice ${invoice.invoice_number} is already in state '${targetStatus}'`,
        );
      }

      if (currentStatus === 'paid') {
        throw new InvoiceAlreadyPaidError(
          `Supplier invoice ${invoice.invoice_number} is already fully paid`,
        );
      }

      if (currentStatus === 'cancelled') {
        throw new InvoiceCancelledError(
          `Supplier invoice ${invoice.invoice_number} is cancelled and cannot transition`,
        );
      }

      if (targetStatus === 'cancelled' && compareDecimal(invoice.amount_paid, 0) > 0) {
        throw new InvalidSupplierInvoiceStateTransitionError(
          currentStatus,
          targetStatus,
          `Cannot cancel invoice ${invoice.invoice_number} because payments have already been recorded`,
        );
      }

      if (!this.canTransition(currentStatus, targetStatus)) {
        throw new InvalidSupplierInvoiceStateTransitionError(
          currentStatus,
          targetStatus,
          `Cannot transition supplier invoice ${invoice.invoice_number} from status '${currentStatus}' to '${targetStatus}'`,
        );
      }

      const updated = (await supplierInvoiceRepository.update(
        organizationId,
        invoiceId,
        {
          status: targetStatus,
          updated_by: userId || null,
        },
        tx,
      ))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'SUPPLIER_INVOICE',
          entity_id: invoiceId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'SUPPLIER_INVOICE_STATUS_TRANSITION',
            invoice_id: invoiceId,
            invoice_number: invoice.invoice_number,
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

export const supplierInvoiceStateMachineService = new SupplierInvoiceStateMachineService();
