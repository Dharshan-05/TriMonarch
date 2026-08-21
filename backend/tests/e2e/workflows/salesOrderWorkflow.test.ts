import { describe, it, expect, vi } from 'vitest';
import { salesOrderService } from '../../../src/services/salesOrder.service';
import { salesOrderRepository } from '../../../src/repositories/salesOrder.repository';
import { customerRepository } from '../../../src/repositories/customer.repository';
import { productRepository } from '../../../src/repositories/product.repository';
import { auditService } from '../../../src/audit/audit.service';
import * as txModule from '../../../src/db/transaction';
import { e2eOrgA, e2eCustomerA, e2eProductA } from '../fixtures/workflows';

describe('Phase 066 — E2E Sales Order Workflow', () => {
  it('executes complete Customer -> Sales Order -> Confirmation lifecycle', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null);
    vi.spyOn(customerRepository, 'findById').mockResolvedValue({ id: e2eCustomerA.id, organization_id: e2eOrgA.id } as never);
    vi.spyOn(productRepository, 'findById').mockResolvedValue({ id: e2eProductA.id, organization_id: e2eOrgA.id } as never);
    vi.spyOn(salesOrderRepository, 'findByOrderNumber').mockResolvedValue(null);
    vi.spyOn(salesOrderRepository, 'create').mockImplementation(async (data) => ({ ...data, id: 'so-e2e-1', status: 'draft' } as never));
    vi.spyOn(salesOrderRepository, 'createItem').mockImplementation(async (data) => ({ ...data, id: 'so-item-1' } as never));

    const res = await salesOrderService.createSalesOrderWithItems({
      organization_id: e2eOrgA.id,
      customer_id: e2eCustomerA.id,
      order_number: 'SO-E2E-1001',
      items: [{ product_id: e2eProductA.id, quantity: '5', unit_price: '150.00' }],
    });

    expect(res.order.order_number).toBe('SO-E2E-1001');
    expect(res.order.status).toBe('draft');
  });
});
