import { describe, it, expect, vi } from 'vitest';
import { supplierPaymentService } from '../src/services/supplierPayment.service';
import { supplierInvoiceRepository } from '../src/repositories/supplierInvoice.repository';
import { supplierPaymentRepository } from '../src/repositories/supplierPayment.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { OverPaymentError } from '../src/types';
import { PoolClient } from 'pg';
import { SupplierInvoice, SupplierPayment, AuditLog } from '../src/types/database';

describe('Supplier Invoice Concurrency Control (Phase 030)', () => {
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
    payment_number: 'PAY-001',
    payment_date: new Date(),
    amount: '700.0000',
    payment_method: 'bank_transfer',
    reference_number: null,
    notes: null,
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('should prevent over-payment when concurrent payment requests exceed current balance due', async () => {
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    // Request 1: Payment of 700 on 1000 due -> balance becomes 300
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockInvoice);
    vi.spyOn(supplierPaymentRepository, 'findByPaymentNumber').mockResolvedValueOnce(null);
    vi.spyOn(supplierPaymentRepository, 'create').mockResolvedValueOnce(mockPayment);
    vi.spyOn(supplierInvoiceRepository, 'update').mockResolvedValueOnce({
      ...mockInvoice,
      amount_paid: '700.0000',
      amount_due: '300.0000',
      status: 'partially_paid',
    });

    const res1 = await supplierPaymentService.recordPayment(
      {
        organization_id: orgAId,
        supplier_invoice_id: invoiceId,
        amount: 700,
        payment_method: 'bank_transfer',
      },
      userAId,
    );
    expect(res1.invoice.amount_due).toBe('300.0000');

    // Request 2: Payment of 700 submitted concurrently -> invoice row locked, re-fetched balance due is now 300 -> 700 > 300 throws OverPaymentError!
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce(res1.invoice);

    await expect(
      supplierPaymentService.recordPayment(
        {
          organization_id: orgAId,
          supplier_invoice_id: invoiceId,
          amount: 700,
          payment_method: 'bank_transfer',
        },
        userAId,
      ),
    ).rejects.toThrow(OverPaymentError);
  });
});
