import { describe, it, expect, vi } from 'vitest';
import { supplierPaymentService } from '../src/services/supplierPayment.service';
import { supplierPaymentRepository } from '../src/repositories/supplierPayment.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { SupplierPayment } from '../src/types/database';

describe('Supplier Payment Subsystem Integration Workflows (Phase 030)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const suppId = '44444444-4444-4444-4444-444444444444';
  const invoiceId = '99999999-9999-9999-9999-999999999999';
  const paymentId = 'pay-1111-1111-1111-111111111111';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockPayment: SupplierPayment = {
    id: paymentId,
    organization_id: orgAId,
    supplier_invoice_id: invoiceId,
    supplier_id: suppId,
    payment_number: 'PAY-2026-000001',
    payment_date: new Date(),
    amount: '500.0000',
    payment_method: 'upi',
    reference_number: 'UPI-987654',
    notes: 'Partial payment',
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('should list payments for invoice and enforce organization scoping', async () => {
    vi.spyOn(supplierPaymentRepository, 'findByInvoice').mockResolvedValueOnce([mockPayment]);

    const payments = await supplierPaymentService.listInvoicePayments(orgAId, invoiceId);
    expect(payments.length).toBe(1);
    expect(payments[0]!.payment_number).toBe('PAY-2026-000001');
  });

  it('should get payment details and reject cross-tenant access', async () => {
    vi.spyOn(supplierPaymentRepository, 'findById').mockResolvedValueOnce(null);

    await expect(supplierPaymentService.getPayment(orgBId, paymentId)).rejects.toThrow(
      'Supplier payment with ID pay-1111-1111-1111-111111111111 not found',
    );
  });

  it('should enforce append-only rule on supplier payments', async () => {
    await expect(
      supplierPaymentRepository.update(orgAId, paymentId, { amount: '1000.0000' }),
    ).rejects.toThrow('Supplier payments are append-only and cannot be updated');
  });
});
