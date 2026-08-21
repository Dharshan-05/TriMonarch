import { describe, it, expect, vi } from 'vitest';
import { supplierInvoiceRepository } from '../src/repositories/supplierInvoice.repository';
import { PoolClient } from 'pg';

describe('Supplier Invoice Repository Subsystem (Phase 030)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const suppId = '44444444-4444-4444-4444-444444444444';
  const invoiceId = '99999999-9999-9999-9999-999999999999';

  const mockInvoice = {
    id: invoiceId,
    organization_id: orgAId,
    supplier_id: suppId,
    purchase_order_id: null,
    purchase_receipt_id: null,
    invoice_number: 'PINV-2026-000001',
    supplier_invoice_number: 'SUPP-INV-101',
    status: 'draft' as const,
    invoice_date: new Date(),
    due_date: null,
    currency: 'INR',
    subtotal: '1000.0000',
    discount_amount: '0.0000',
    tax_amount: '180.0000',
    total_amount: '1180.0000',
    amount_paid: '0.0000',
    amount_due: '1180.0000',
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createMockPoolClient = (overrideRows?: Record<string, unknown>[]) => {
    const mockQuery = vi.fn().mockImplementation(async (sql: string, params?: unknown[]) => {
      if (params && params.includes(orgBId)) {
        return { rows: [], rowCount: 0, command: sql, oid: 0, fields: [] };
      }
      return {
        rows: overrideRows !== undefined ? overrideRows : [mockInvoice],
        rowCount: (overrideRows !== undefined ? overrideRows : [mockInvoice]).length,
        command: sql,
        oid: 0,
        fields: [],
      };
    });
    const mockRelease = vi.fn();
    return {
      query: mockQuery,
      release: mockRelease,
    } as unknown as PoolClient;
  };

  it('should create supplier invoice header with organization scoping', async () => {
    const mockClient = createMockPoolClient();

    const result = await supplierInvoiceRepository.create(
      {
        organization_id: orgAId,
        supplier_id: suppId,
        invoice_number: 'PINV-2026-000001',
        supplier_invoice_number: 'SUPP-INV-101',
      },
      mockClient,
    );

    expect(result.id).toBe(invoiceId);
    expect(result.supplier_invoice_number).toBe('SUPP-INV-101');
  });

  it('should retrieve invoice by ID and enforce tenant isolation', async () => {
    const mockClient = createMockPoolClient();

    const foundOrgA = await supplierInvoiceRepository.findById(orgAId, invoiceId, mockClient);
    expect(foundOrgA).not.toBeNull();

    const foundOrgB = await supplierInvoiceRepository.findById(orgBId, invoiceId, mockClient);
    expect(foundOrgB).toBeNull();
  });

  it('should acquire FOR UPDATE row lock via lockByIdForUpdate', async () => {
    const mockClient = createMockPoolClient();

    const locked = await supplierInvoiceRepository.lockByIdForUpdate(orgAId, invoiceId, mockClient);
    expect(locked).not.toBeNull();
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      [invoiceId, orgAId],
    );
  });

  it('should calculate AP summary with correct SQL query', async () => {
    const mockSummary = {
      total_invoiced: '5000.0000',
      total_paid: '2000.0000',
      total_outstanding: '3000.0000',
      overdue_amount: '1000.0000',
    };
    const mockClient = createMockPoolClient([mockSummary]);

    const summary = await supplierInvoiceRepository.getAPSummary(orgAId, mockClient);
    expect(summary.total_invoiced).toBe('5000.0000');
    expect(summary.total_outstanding).toBe('3000.0000');
  });
});
