import { describe, it, expect, vi } from 'vitest';
import { supplierInvoiceStateMachineService } from '../src/services/supplierInvoiceStateMachine.service';
import { supplierInvoiceRepository } from '../src/repositories/supplierInvoice.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  InvalidSupplierInvoiceStateTransitionError,
  InvoiceAlreadyPaidError,
  InvoiceCancelledError,
} from '../src/types';
import { PoolClient } from 'pg';
import { SupplierInvoice, AuditLog } from '../src/types/database';

describe('Supplier Invoice State Machine (Phase 030)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const invoiceId = '99999999-9999-9999-9999-999999999999';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockInvoice: SupplierInvoice = {
    id: invoiceId,
    organization_id: orgAId,
    supplier_id: '44444444-4444-4444-4444-444444444444',
    purchase_order_id: null,
    purchase_receipt_id: null,
    invoice_number: 'PINV-2026-000001',
    supplier_invoice_number: 'SUPP-101',
    status: 'draft',
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

  it('should validate allowed state transitions correctly', () => {
    expect(supplierInvoiceStateMachineService.canTransition('draft', 'posted')).toBe(true);
    expect(supplierInvoiceStateMachineService.canTransition('draft', 'cancelled')).toBe(true);
    expect(supplierInvoiceStateMachineService.canTransition('posted', 'partially_paid')).toBe(true);
    expect(supplierInvoiceStateMachineService.canTransition('posted', 'paid')).toBe(true);
    expect(supplierInvoiceStateMachineService.canTransition('partially_paid', 'paid')).toBe(true);
    expect(supplierInvoiceStateMachineService.canTransition('paid', 'draft')).toBe(false);
    expect(supplierInvoiceStateMachineService.canTransition('cancelled', 'posted')).toBe(false);
  });

  it('should reject transition on an already paid invoice', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockInvoice,
      status: 'paid',
    });

    await expect(
      supplierInvoiceStateMachineService.transitionInvoice(orgAId, invoiceId, 'posted', userAId),
    ).rejects.toThrow(InvoiceAlreadyPaidError);
  });

  it('should reject transition on a cancelled invoice', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockInvoice,
      status: 'cancelled',
    });

    await expect(
      supplierInvoiceStateMachineService.transitionInvoice(orgAId, invoiceId, 'posted', userAId),
    ).rejects.toThrow(InvoiceCancelledError);
  });

  it('should reject cancelling an invoice with recorded payments', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockInvoice,
      status: 'partially_paid',
      amount_paid: '500.0000',
    });

    await expect(
      supplierInvoiceStateMachineService.transitionInvoice(orgAId, invoiceId, 'cancelled', userAId),
    ).rejects.toThrow(InvalidSupplierInvoiceStateTransitionError);
  });

  it('should transition draft invoice to posted successfully', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockInvoice);
    vi.spyOn(supplierInvoiceRepository, 'update').mockResolvedValueOnce({
      ...mockInvoice,
      status: 'posted',
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const posted = await supplierInvoiceStateMachineService.transitionInvoice(
      orgAId,
      invoiceId,
      'posted',
      userAId,
    );

    expect(posted.status).toBe('posted');
  });
});
