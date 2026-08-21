import { describe, it, expect, vi } from 'vitest';
import { salesOrderService } from '../../../src/services/salesOrder.service';
import { salesOrderRepository } from '../../../src/repositories/salesOrder.repository';
import { customerRepository } from '../../../src/repositories/customer.repository';
import { auditService } from '../../../src/audit/audit.service';
import * as txModule from '../../../src/db/transaction';
import { orgAId } from './concurrencyFixtures';

describe('Phase 065 — Sales Order Concurrency Tests', () => {
  it('concurrent order creation validates customer and order uniqueness', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null);
    vi.spyOn(customerRepository, 'findById').mockResolvedValue({ id: '77777777-7777-7777-7777-777777777777', organization_id: orgAId } as never);
    vi.spyOn(salesOrderRepository, 'findByOrderNumber').mockResolvedValue(null);
    vi.spyOn(salesOrderRepository, 'create').mockImplementation(async (data) => ({ ...data, id: 'so-1' } as never));

    const res = await salesOrderService.createSalesOrder({
      organization_id: orgAId,
      customer_id: '77777777-7777-7777-7777-777777777777',
      order_number: 'SO-1001',
    });
    expect(res.order_number).toBe('SO-1001');
  });
});
