import { describe, it, expect, vi } from 'vitest';
import { supplierPaymentService } from '../src/services/supplierPayment.service';
import { supplierPaymentRepository } from '../src/repositories/supplierPayment.repository';
import { supplierInvoiceRepository } from '../src/repositories/supplierInvoice.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  OverPaymentError,
  DuplicatePaymentNumberError,
  InvoiceCancelledError,
} from '../src/types';
import { PoolClient } from 'pg';
import { SupplierInvoice, SupplierPayment, AuditLog } from '../src/types/database';

describe('Supplier Payment Service Subsystem (Phase 030)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const suppId = '44444444-4444-4444-4444-444444444444';
  const invoiceId = '99999999-9999-9999-9999-999999999999';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockInvoice: SupplierInvoice = {
    id: invoiceId,
    organization_id: orgAId,
    supplier_id: suppId,
    purchase_order_id: null,
    purchase_receipt_id: null,
    invoice_number: 'PINV-2026-000001',
    supplier_invoice_number: 'SUPP-INV-101',
    status: 'posted',
    invoice_date: new Date(),
    due_date: null,
    currency: 'INR',
    subtotal: '1000.0000',
    discount_amount: '0.0000',
    tax_amount: '0.0000',
    total_amount: '1000.0000',
    amount_paid: '0.0000',
    amount_due: '1000.0000',
    notes: null,
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPayment: SupplierPayment = {
    id: 'pay-1',
    organization_id: orgAId,
    supplier_invoice_id: invoiceId,
    supplier_id: suppId,
    payment_number: 'PAY-2026-000001',
    payment_date: new Date(),
    amount: '400.0000',
    payment_method: 'bank_transfer',
    reference_number: 'REF-12345',
    notes: null,
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('PARTIAL PAYMENT: records partial payment and updates invoice status to partially_paid', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockInvoice);
    vi.spyOn(supplierPaymentRepository, 'findByPaymentNumber').mockResolvedValueOnce(null);
    vi.spyOn(supplierPaymentRepository, 'create').mockResolvedValueOnce(mockPayment);
    vi.spyOn(supplierInvoiceRepository, 'update').mockResolvedValueOnce({
      ...mockInvoice,
      amount_paid: '400.0000',
      amount_due: '600.0000',
      status: 'partially_paid',
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const result = await supplierPaymentService.recordPayment(
      {
        organization_id: orgAId,
        supplier_invoice_id: invoiceId,
        amount: 400,
        payment_method: 'bank_transfer',
      },
      userAId,
    );

    expect(result.payment.amount).toBe('400.0000');
    expect(result.invoice.status).toBe('partially_paid');
    expect(result.invoice.amount_due).toBe('600.0000');
  });

  it('FULL PAYMENT: records full payment and updates invoice status to paid', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockInvoice,
      amount_paid: '400.0000',
      amount_due: '600.0000',
      status: 'partially_paid',
    });
    vi.spyOn(supplierPaymentRepository, 'findByPaymentNumber').mockResolvedValueOnce(null);
    vi.spyOn(supplierPaymentRepository, 'create').mockResolvedValueOnce({
      ...mockPayment,
      id: 'pay-2',
      amount: '600.0000',
    });
    vi.spyOn(supplierInvoiceRepository, 'update').mockResolvedValueOnce({
      ...mockInvoice,
      amount_paid: '1000.0000',
      amount_due: '0.0000',
      status: 'paid',
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const result = await supplierPaymentService.recordPayment(
      {
        organization_id: orgAId,
        supplier_invoice_id: invoiceId,
        amount: 600,
        payment_method: 'bank_transfer',
      },
      userAId,
    );

    expect(result.invoice.status).toBe('paid');
    expect(result.invoice.amount_due).toBe('0.0000');
  });

  it('OVER-PAYMENT PROTECTION: rejects payment amount exceeding current balance due', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockInvoice);

    await expect(
      supplierPaymentService.recordPayment(
        {
          organization_id: orgAId,
          supplier_invoice_id: invoiceId,
          amount: 1500,
          payment_method: 'bank_transfer',
        },
        userAId,
      ),
    ).rejects.toThrow(OverPaymentError);
  });

  it('IDEMPOTENCY: rejects duplicate payment number', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockInvoice);
    vi.spyOn(supplierPaymentRepository, 'findByPaymentNumber').mockResolvedValueOnce(mockPayment);

    await expect(
      supplierPaymentService.recordPayment(
        {
          organization_id: orgAId,
          supplier_invoice_id: invoiceId,
          payment_number: 'PAY-2026-000001',
          amount: 400,
          payment_method: 'bank_transfer',
        },
        userAId,
      ),
    ).rejects.toThrow(DuplicatePaymentNumberError);
  });

  it('REJECT CANCELLED: payment on cancelled invoice throws error', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockInvoice,
      status: 'cancelled',
    });

    await expect(
      supplierPaymentService.recordPayment(
        {
          organization_id: orgAId,
          supplier_invoice_id: invoiceId,
          amount: 400,
          payment_method: 'bank_transfer',
        },
        userAId,
      ),
    ).rejects.toThrow(InvoiceCancelledError);
  });
});
