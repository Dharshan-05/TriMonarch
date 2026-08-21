import { describe, it, expect, vi } from 'vitest';
import { accountsPayableService } from '../src/services/accountsPayable.service';
import { supplierInvoiceRepository } from '../src/repositories/supplierInvoice.repository';
import { supplierRepository } from '../src/repositories/supplier.repository';
import { SupplierNotFoundError } from '../src/types';

describe('Accounts Payable Service Subsystem (Phase 030)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const suppId = '44444444-4444-4444-4444-444444444444';

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

  it('getSupplierOutstandingBalance: returns correct outstanding balance for a valid supplier', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
    vi.spyOn(supplierInvoiceRepository, 'calculateOutstanding').mockResolvedValueOnce('600.0000');

    const result = await accountsPayableService.getSupplierOutstandingBalance(orgAId, suppId);
    expect(result.supplier_id).toBe(suppId);
    expect(result.outstanding_balance).toBe('600.0000');
  });

  it('getSupplierOutstandingBalance: throws SupplierNotFoundError for invalid supplier', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(null);

    await expect(
      accountsPayableService.getSupplierOutstandingBalance(orgAId, suppId),
    ).rejects.toThrow(SupplierNotFoundError);
  });

  it('getAccountsPayableSummary: returns summary numbers correctly', async () => {
    const mockSummary = {
      total_invoiced: '10000.0000',
      total_paid: '4000.0000',
      total_outstanding: '6000.0000',
      overdue_amount: '1500.0000',
    };
    vi.spyOn(supplierInvoiceRepository, 'getAPSummary').mockResolvedValueOnce(mockSummary);

    const summary = await accountsPayableService.getAccountsPayableSummary(orgAId);
    expect(summary.total_invoiced).toBe('10000.0000');
    expect(summary.total_outstanding).toBe('6000.0000');
  });

  it('getAccountsPayableAging: returns aging buckets correctly', async () => {
    const mockAging = {
      current: '4000.0000',
      days_1_30: '1000.0000',
      days_31_60: '500.0000',
      days_61_90: '300.0000',
      days_90_plus: '200.0000',
    };
    vi.spyOn(supplierInvoiceRepository, 'getAPAging').mockResolvedValueOnce(mockAging);

    const aging = await accountsPayableService.getAccountsPayableAging(orgAId);
    expect(aging.current).toBe('4000.0000');
    expect(aging.days_90_plus).toBe('200.0000');
  });
});
