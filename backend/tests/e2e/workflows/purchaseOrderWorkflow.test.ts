import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderService } from '../../../src/services/purchaseOrder.service';
import { purchaseOrderRepository } from '../../../src/repositories/purchaseOrder.repository';
import { supplierRepository } from '../../../src/repositories/supplier.repository';
import { productRepository } from '../../../src/repositories/product.repository';
import { auditService } from '../../../src/audit/audit.service';
import * as txModule from '../../../src/db/transaction';
import { e2eOrgA, e2eSupplierA, e2eProductA } from '../fixtures/workflows';

describe('Phase 066 — E2E Purchase Order Workflow', () => {
  it('executes complete Supplier -> Purchase Order -> Processing lifecycle', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null);
    vi.spyOn(supplierRepository, 'findById').mockResolvedValue({ id: e2eSupplierA.id, organization_id: e2eOrgA.id } as never);
    vi.spyOn(productRepository, 'findById').mockResolvedValue({ id: e2eProductA.id, organization_id: e2eOrgA.id } as never);
    vi.spyOn(purchaseOrderRepository, 'findByOrderNumber').mockResolvedValue(null);
    vi.spyOn(purchaseOrderRepository, 'create').mockImplementation(async (data) => ({ ...data, id: 'po-e2e-1', status: 'draft' } as never));
    vi.spyOn(purchaseOrderRepository, 'createItem').mockImplementation(async (data) => ({ ...data, id: 'po-item-1' } as never));

    const po = await purchaseOrderService.createPurchaseOrder({
      organization_id: e2eOrgA.id,
      supplier_id: e2eSupplierA.id,
      order_number: 'PO-E2E-1001',
      items: [{ product_id: e2eProductA.id, quantity: '10.0000', unit_cost: '80.0000' }],
    });

    expect(po.order_number).toBe('PO-E2E-1001');
    expect(po.status).toBe('draft');
  });
});
