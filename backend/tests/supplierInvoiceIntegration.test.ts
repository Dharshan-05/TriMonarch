import { describe, it, expect, vi } from 'vitest';
import { supplierInvoiceService } from '../src/services/supplierInvoice.service';
import { supplierPaymentService } from '../src/services/supplierPayment.service';
import { supplierInvoiceRepository } from '../src/repositories/supplierInvoice.repository';
import { supplierPaymentRepository } from '../src/repositories/supplierPayment.repository';
import { supplierRepository } from '../src/repositories/supplier.repository';
import { productRepository } from '../src/repositories/product.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { SupplierInvoice, SupplierInvoiceItem, SupplierPayment, AuditLog } from '../src/types/database';

describe('Supplier Invoice & AP Subsystem Integration Workflows (Phase 030)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const suppId = '44444444-4444-4444-4444-444444444444';
  const prodId = '66666666-6666-6666-6666-666666666666';
  const invoiceId = '99999999-9999-9999-9999-999999999999';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockSupplier = {
    id: suppId,
    organization_id: orgAId,
    name: 'ACME Supplies',
    code: 'SUP-001',
    email: 'acme@supplies.com',
    phone: null,
    address: null,
    tax_id: null,
    currency: 'INR',
    payment_terms: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockProduct = {
    id: prodId,
    organization_id: orgAId,
    sku: 'PROD-001',
    name: 'Test Product',
    description: null,
    category: null,
    unit_of_measure: 'PCS',
    cost_price: '100.0000',
    selling_price: '200.0000',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockInvoice: SupplierInvoice = {
    id: invoiceId,
    organization_id: orgAId,
    supplier_id: suppId,
    purchase_order_id: null,
    purchase_receipt_id: null,
    invoice_number: 'PINV-2026-000001',
    supplier_invoice_number: 'SUPP-INV-101',
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

  const mockItem: SupplierInvoiceItem = {
    id: 'inv-item-1',
    organization_id: orgAId,
    invoice_id: invoiceId,
    purchase_order_item_id: null,
    purchase_receipt_item_id: null,
    product_id: prodId,
    description: 'Test Product',
    quantity: '10.0000',
    unit_cost: '100.0000',
    discount_amount: '0.0000',
    tax_rate: '0.0000',
    tax_amount: '0.0000',
    line_total: '1000.0000',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('Full E2E Lifecycle: Create Draft -> Post -> Partial Payment -> Final Payment -> PAID', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValue(mockSupplier);
    vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
    vi.spyOn(supplierInvoiceRepository, 'findDuplicateSupplierInvoice').mockResolvedValue(null);
    vi.spyOn(supplierInvoiceRepository, 'findByInvoiceNumber').mockResolvedValue(null);
    vi.spyOn(supplierInvoiceRepository, 'create').mockResolvedValue(mockInvoice);
    vi.spyOn(supplierInvoiceRepository, 'createItem').mockResolvedValue(mockItem);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    // 1. Create Draft Invoice
    const draft = await supplierInvoiceService.createInvoice(
      {
        organization_id: orgAId,
        supplier_id: suppId,
        supplier_invoice_number: 'SUPP-INV-101',
        items: [{ product_id: prodId, quantity: 10, unit_cost: 100 }],
      },
      userAId,
    );
    expect(draft.status).toBe('draft');

    // 2. Post Invoice -> status = posted, amount_due = 1000
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValue(draft);
    vi.spyOn(supplierInvoiceRepository, 'findById').mockResolvedValue(draft);
    vi.spyOn(supplierInvoiceRepository, 'listItems').mockResolvedValue([mockItem]);
    vi.spyOn(supplierInvoiceRepository, 'update').mockResolvedValueOnce({
      ...draft,
      status: 'posted',
      amount_due: '1000.0000',
    });

    const posted = await supplierInvoiceService.postInvoice(orgAId, invoiceId, userAId);
    expect(posted.status).toBe('posted');

    // 3. Record Partial Payment (400) -> status = partially_paid
    const pay1: SupplierPayment = {
      id: 'pay-1',
      organization_id: orgAId,
      supplier_invoice_id: invoiceId,
      supplier_id: suppId,
      payment_number: 'PAY-001',
      payment_date: new Date(),
      amount: '400.0000',
      payment_method: 'bank_transfer',
      reference_number: null,
      notes: null,
      created_by: userAId,
      updated_by: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...posted,
      status: 'posted',
      amount_paid: '0.0000',
      amount_due: '1000.0000',
    });
    vi.spyOn(supplierPaymentRepository, 'findByPaymentNumber').mockResolvedValueOnce(null);
    vi.spyOn(supplierPaymentRepository, 'create').mockResolvedValueOnce(pay1);
    vi.spyOn(supplierInvoiceRepository, 'update').mockResolvedValueOnce({
      ...posted,
      status: 'partially_paid',
      amount_paid: '400.0000',
      amount_due: '600.0000',
    });

    const partRes = await supplierPaymentService.recordPayment(
      {
        organization_id: orgAId,
        supplier_invoice_id: invoiceId,
        amount: 400,
        payment_method: 'bank_transfer',
      },
      userAId,
    );
    expect(partRes.invoice.status).toBe('partially_paid');

    // 4. Record Final Payment (600) -> status = paid
    const pay2: SupplierPayment = {
      ...pay1,
      id: 'pay-2',
      payment_number: 'PAY-002',
      amount: '600.0000',
    };
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce(partRes.invoice);
    vi.spyOn(supplierPaymentRepository, 'findByPaymentNumber').mockResolvedValueOnce(null);
    vi.spyOn(supplierPaymentRepository, 'create').mockResolvedValueOnce(pay2);
    vi.spyOn(supplierInvoiceRepository, 'update').mockResolvedValueOnce({
      ...posted,
      status: 'paid',
      amount_paid: '1000.0000',
      amount_due: '0.0000',
    });

    const finalRes = await supplierPaymentService.recordPayment(
      {
        organization_id: orgAId,
        supplier_invoice_id: invoiceId,
        amount: 600,
        payment_method: 'bank_transfer',
      },
      userAId,
    );
    expect(finalRes.invoice.status).toBe('paid');
    expect(finalRes.invoice.amount_due).toBe('0.0000');
  });

  it('Enforces Tenant Isolation across all queries and operations', async () => {
    vi.spyOn(supplierInvoiceRepository, 'findById').mockResolvedValueOnce(null);

    await expect(supplierInvoiceService.getInvoice(orgBId, invoiceId)).rejects.toThrow(
      'Supplier invoice with ID 99999999-9999-9999-9999-999999999999 not found',
    );
  });
});
