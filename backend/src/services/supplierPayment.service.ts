import { PoolClient } from 'pg';
import {
  supplierPaymentRepository,
  SupplierPaymentFilterParams,
} from '../repositories/supplierPayment.repository';
import { supplierInvoiceRepository } from '../repositories/supplierInvoice.repository';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  SupplierPayment,
  SupplierInvoice,
  CreateSupplierPaymentInput,
  PaymentMethod,
} from '../types/database';
import { PaginatedResult } from '../repositories/base';
import {
  SupplierPaymentNotFoundError,
  SupplierInvoiceNotFoundError,
  OverPaymentError,
  DuplicatePaymentNumberError,
  InvoiceAlreadyPaidError,
  InvoiceCancelledError,
  InvalidPaymentAmountError,
  ValidationError,
} from '../types';
import {
  toDecimal,
  formatDecimal,
  compareDecimal,
  addDecimal,
  subtractDecimal,
  MONEY_SCALE,
} from '../utils/decimal';

export interface RecordPaymentServiceInput {
  organization_id: string;
  supplier_invoice_id: string;
  payment_number?: string;
  payment_date?: Date | string;
  amount: number | string;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  notes?: string | null;
}

export interface RecordPaymentResult {
  payment: SupplierPayment;
  invoice: SupplierInvoice;
}

export class SupplierPaymentService {
  /**
   * Generates a unique payment number per organization.
   */
  private async generatePaymentNumber(organizationId: string, tx?: PoolClient): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(1000 + Math.random() * 9000);
    let candidate = `PAY-${year}-${timestamp}${random}`;

    let existing = await supplierPaymentRepository.findByPaymentNumber(
      organizationId,
      candidate,
      tx,
    );
    while (existing) {
      const nextRandom = Math.floor(1000 + Math.random() * 9000);
      candidate = `PAY-${year}-${timestamp}${nextRandom}`;
      existing = await supplierPaymentRepository.findByPaymentNumber(
        organizationId,
        candidate,
        tx,
      );
    }
    return candidate;
  }

  /**
   * Records a payment against a Supplier Invoice:
   * CRITICAL TRANSACTION:
   * 1. Locks invoice FOR UPDATE.
   * 2. Validates status (posted or partially_paid).
   * 3. Validates amount > 0 and amount <= invoice.amount_due (OverPaymentError if exceeded).
   * 4. Idempotency check on payment_number.
   * 5. Creates payment row.
   * 6. Updates invoice amount_paid & amount_due.
   * 7. Transitions invoice status to 'paid' or 'partially_paid'.
   * 8. Category A audit logging.
   */
  async recordPayment(
    input: RecordPaymentServiceInput,
    userId?: string,
    requestId?: string,
  ): Promise<RecordPaymentResult> {
    return withTransaction(async (tx) => {
      // 1. Lock invoice FOR UPDATE
      const invoice = await supplierInvoiceRepository.lockByIdForUpdate(
        input.organization_id,
        input.supplier_invoice_id,
        tx,
      );
      if (!invoice) {
        throw new SupplierInvoiceNotFoundError(
          `Supplier invoice with ID ${input.supplier_invoice_id} not found`,
        );
      }

      // 2. Status validation
      if (invoice.status === 'cancelled') {
        throw new InvoiceCancelledError(
          `Cannot record payment on cancelled invoice ${invoice.invoice_number}`,
        );
      }
      if (invoice.status === 'paid') {
        throw new InvoiceAlreadyPaidError(
          `Invoice ${invoice.invoice_number} is already fully paid`,
        );
      }
      if (invoice.status === 'draft') {
        throw new ValidationError(
          `Cannot record payment on draft invoice ${invoice.invoice_number}. Post the invoice first.`,
        );
      }

      // 3. Amount validation
      let amountDec;
      try {
        amountDec = toDecimal(input.amount);
      } catch {
        throw new InvalidPaymentAmountError('Invalid payment amount format');
      }
      if (compareDecimal(amountDec, 0) <= 0) {
        throw new InvalidPaymentAmountError('Payment amount must be greater than zero');
      }

      const currentDueDec = toDecimal(invoice.amount_due);
      if (compareDecimal(amountDec, currentDueDec) > 0) {
        throw new OverPaymentError(
          `Payment amount (${formatDecimal(amountDec, MONEY_SCALE)}) exceeds invoice balance due (${formatDecimal(currentDueDec, MONEY_SCALE)})`,
        );
      }

      // 4. Payment number generation / duplicate check
      let paymentNumber = input.payment_number?.trim();
      if (paymentNumber) {
        const existing = await supplierPaymentRepository.findByPaymentNumber(
          input.organization_id,
          paymentNumber,
          tx,
        );
        if (existing) {
          throw new DuplicatePaymentNumberError(
            `Payment number '${paymentNumber}' already exists in organization`,
          );
        }
      } else {
        paymentNumber = await this.generatePaymentNumber(input.organization_id, tx);
      }

      // 5. Create Payment record
      const paymentInput: CreateSupplierPaymentInput = {
        organization_id: input.organization_id,
        supplier_invoice_id: input.supplier_invoice_id,
        supplier_id: invoice.supplier_id,
        payment_number: paymentNumber,
        payment_date: input.payment_date || new Date(),
        amount: formatDecimal(amountDec, MONEY_SCALE),
        payment_method: input.payment_method,
        reference_number: input.reference_number || null,
        notes: input.notes || null,
        created_by: userId || null,
      };

      const payment = await supplierPaymentRepository.create(paymentInput, tx);

      // 6. Update invoice balances
      const currentPaidDec = toDecimal(invoice.amount_paid);
      const newPaidDec = addDecimal(currentPaidDec, amountDec, MONEY_SCALE);
      const totalDec = toDecimal(invoice.total_amount);
      const newDueDec = subtractDecimal(totalDec, newPaidDec, MONEY_SCALE);

      const targetStatus = compareDecimal(newDueDec, 0) === 0 ? 'paid' : 'partially_paid';

      const updatedInvoice = (await supplierInvoiceRepository.update(
        input.organization_id,
        input.supplier_invoice_id,
        {
          amount_paid: formatDecimal(newPaidDec, MONEY_SCALE),
          amount_due: formatDecimal(newDueDec, MONEY_SCALE),
          status: targetStatus,
          updated_by: userId || null,
        },
        tx,
      ))!;

      // 7. Category A audit logging
      await auditService.recordAuditEvent(
        {
          organization_id: input.organization_id,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'SUPPLIER_PAYMENT',
          entity_id: payment.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'SUPPLIER_PAYMENT_CREATED',
            payment_id: payment.id,
            payment_number: payment.payment_number,
            supplier_invoice_id: invoice.id,
            amount: payment.amount,
            new_amount_due: updatedInvoice.amount_due,
            new_status: targetStatus,
          },
        },
        tx,
      );

      return {
        payment,
        invoice: updatedInvoice,
      };
    });
  }

  /**
   * Retrieves payment details.
   */
  async getPayment(organizationId: string, paymentId: string): Promise<SupplierPayment> {
    const payment = await supplierPaymentRepository.findById(organizationId, paymentId);
    if (!payment) {
      throw new SupplierPaymentNotFoundError(`Supplier payment with ID ${paymentId} not found`);
    }
    return payment;
  }

  /**
   * Lists payments for an invoice.
   */
  async listInvoicePayments(
    organizationId: string,
    supplierInvoiceId: string,
  ): Promise<SupplierPayment[]> {
    return supplierPaymentRepository.findByInvoice(organizationId, supplierInvoiceId);
  }

  /**
   * Lists payments across organization with pagination & filters.
   */
  async listPayments(
    organizationId: string,
    params?: SupplierPaymentFilterParams,
  ): Promise<PaginatedResult<SupplierPayment>> {
    return supplierPaymentRepository.listPayments(organizationId, params || {});
  }
}

export const supplierPaymentService = new SupplierPaymentService();
