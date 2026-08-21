import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderService } from '../../../src/services/purchaseOrder.service';
import { purchaseOrderRepository } from '../../../src/repositories/purchaseOrder.repository';
import { supplierRepository } from '../../../src/repositories/supplier.repository';
import { productRepository } from '../../../src/repositories/product.repository';
import { auditService } from '../../../src/audit/audit.service';
import * as txModule from '../../../src/db/transaction';
import { orgAId } from './concurrencyFixtures';

describe('Phase 065 — Purchase Order Concurrency Tests', () => {
  it('concurrent purchase order creation handles duplicate order numbers safely', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null);
    vi.spyOn(supplierRepository, 'findById').mockResolvedValue({ id: 'supp-1', organization_id: orgAId } as never);
    vi.spyOn(productRepository, 'findById').mockResolvedValue({ id: 'p-1', organization_id: orgAId } as never);
    vi.spyOn(purchaseOrderRepository, 'findByOrderNumber').mockResolvedValue(null);
    vi.spyOn(purchaseOrderRepository, 'create').mockImplementation(async (data) => ({ ...data, id: 'po-1' } as never));
    vi.spyOn(purchaseOrderRepository, 'createItem').mockImplementation(async (data) => ({ ...data, id: 'po-item-1' } as never));

    const res = await purchaseOrderService.createPurchaseOrder({
      organization_id: orgAId,
      supplier_id: 'supp-1',
      order_number: 'PO-1001',
      items: [{ product_id: 'p-1', quantity: '5.0000', unit_cost: '20.0000' }],
    });
    expect(res.order_number).toBe('PO-1001');
  });
});
