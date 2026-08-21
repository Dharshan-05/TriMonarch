import { describe, it, expect, vi } from 'vitest';
import { accountsPayableService } from '../src/services/accountsPayable.service';
import { supplierInvoiceRepository } from '../src/repositories/supplierInvoice.repository';
import { supplierRepository } from '../src/repositories/supplier.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';

describe('Accounts Payable Subsystem Integration Workflows (Phase 030)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const suppId = '44444444-4444-4444-4444-444444444444';

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

  it('AP Summary & Aging integration: retrieves accurate AP reports', async () => {
    vi.spyOn(supplierRepository, 'findById').mockResolvedValue(mockSupplier);
    vi.spyOn(supplierInvoiceRepository, 'getAPSummary').mockResolvedValue({
      total_invoiced: '15000.0000',
      total_paid: '5000.0000',
      total_outstanding: '10000.0000',
      overdue_amount: '2500.0000',
    });
    vi.spyOn(supplierInvoiceRepository, 'getAPAging').mockResolvedValue({
      current: '7500.0000',
      days_1_30: '1500.0000',
      days_31_60: '1000.0000',
      days_61_90: '0.0000',
      days_90_plus: '0.0000',
    });

    const summary = await accountsPayableService.getAccountsPayableSummary(orgAId);
    expect(summary.total_invoiced).toBe('15000.0000');
    expect(summary.total_outstanding).toBe('10000.0000');

    const aging = await accountsPayableService.getAccountsPayableAging(orgAId);
    expect(aging.current).toBe('7500.0000');
    expect(aging.days_1_30).toBe('1500.0000');
  });
});
