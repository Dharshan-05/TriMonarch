import { describe, it, expect, vi } from 'vitest';
import { supplierInvoiceService } from '../src/services/supplierInvoice.service';
import { supplierInvoiceRepository } from '../src/repositories/supplierInvoice.repository';
import { supplierRepository } from '../src/repositories/supplier.repository';
import { productRepository } from '../src/repositories/product.repository';
import { inventoryService } from '../src/services/inventory.service';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  SupplierInvoiceMissingItemsError,
  DuplicateSupplierInvoiceError,
} from '../src/types';
import { PoolClient } from 'pg';
import { SupplierInvoice, SupplierInvoiceItem, AuditLog } from '../src/types/database';

describe('Supplier Invoice Service Subsystem (Phase 030)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
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
    cost_price: '50.0000',
    selling_price: '100.0000',
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
    subtotal: '500.0000',
    discount_amount: '0.0000',
    tax_amount: '90.0000',
    total_amount: '590.0000',
    amount_paid: '0.0000',
    amount_due: '590.0000',
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
    unit_cost: '50.0000',
    discount_amount: '0.0000',
    tax_rate: '18.0000',
    tax_amount: '90.0000',
    line_total: '590.0000',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('VERIFY DRAFT CREATION: creating a draft invoice DOES NOT modify physical stock', async () => {
    const increaseSpy = vi.spyOn(inventoryService, 'increaseStock');

    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
    vi.spyOn(supplierInvoiceRepository, 'findDuplicateSupplierInvoice').mockResolvedValueOnce(null);
    vi.spyOn(supplierInvoiceRepository, 'findByInvoiceNumber').mockResolvedValueOnce(null);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
    vi.spyOn(supplierInvoiceRepository, 'create').mockResolvedValueOnce(mockInvoice);
    vi.spyOn(supplierInvoiceRepository, 'createItem').mockResolvedValueOnce(mockItem);
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const created = await supplierInvoiceService.createInvoice(
      {
        organization_id: orgAId,
        supplier_id: suppId,
        supplier_invoice_number: 'SUPP-INV-101',
        items: [{ product_id: prodId, quantity: 10, unit_cost: 50, tax_rate: 18 }],
      },
      userAId,
    );

    expect(created.status).toBe('draft');
    expect(created.total_amount).toBe('590.0000');
    expect(increaseSpy).not.toHaveBeenCalled();
  });

  it('POST INVOICE: posting invoice creates AP liability and DOES NOT modify physical stock', async () => {
    const increaseSpy = vi.spyOn(inventoryService, 'increaseStock');

    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockInvoice);
    vi.spyOn(supplierInvoiceRepository, 'findById').mockResolvedValue(mockInvoice);
    vi.spyOn(supplierInvoiceRepository, 'listItems').mockResolvedValue([mockItem]);
    vi.spyOn(supplierInvoiceRepository, 'update').mockResolvedValueOnce({
      ...mockInvoice,
      status: 'posted',
      amount_due: '590.0000',
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const posted = await supplierInvoiceService.postInvoice(orgAId, invoiceId, userAId);

    expect(posted.status).toBe('posted');
    expect(posted.amount_due).toBe('590.0000');
    expect(increaseSpy).not.toHaveBeenCalled();
  });

  it('DUPLICATE PROTECTION: rejects invoice with duplicate supplier invoice number', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
    vi.spyOn(supplierInvoiceRepository, 'findDuplicateSupplierInvoice').mockResolvedValueOnce(
      mockInvoice,
    );

    await expect(
      supplierInvoiceService.createInvoice(
        {
          organization_id: orgAId,
          supplier_id: suppId,
          supplier_invoice_number: 'SUPP-INV-101',
          items: [{ product_id: prodId, quantity: 10, unit_cost: 50 }],
        },
        userAId,
      ),
    ).rejects.toThrow(DuplicateSupplierInvoiceError);
  });

  it('REJECT EMPTY INVOICE: posting invoice without items throws error', async () => {
    vi.spyOn(supplierInvoiceRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockInvoice);
    vi.spyOn(supplierInvoiceRepository, 'listItems').mockResolvedValueOnce([]);

    await expect(supplierInvoiceService.postInvoice(orgAId, invoiceId, userAId)).rejects.toThrow(
      SupplierInvoiceMissingItemsError,
    );
  });
});
