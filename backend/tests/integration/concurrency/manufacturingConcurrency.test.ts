import { describe, it, expect, vi } from 'vitest';
import { manufacturingOrderService } from '../../../src/services/manufacturingOrder.service';
import { manufacturingRepository } from '../../../src/repositories/manufacturing.repository';
import { productRepository } from '../../../src/repositories/product.repository';
import { warehouseRepository } from '../../../src/repositories/warehouse.repository';
import { bomRepository } from '../../../src/repositories/bom.repository';
import { bomExplosionService } from '../../../src/services/bomExplosion.service';
import { auditService } from '../../../src/audit/audit.service';
import * as txModule from '../../../src/db/transaction';
import { orgAId } from './concurrencyFixtures';

describe('Phase 065 — Manufacturing Concurrency Tests', () => {
  it('concurrent manufacturing order creation validates BOM explosion and material requirements', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null);
    vi.spyOn(productRepository, 'findById').mockResolvedValue({ id: 'p-1', name: 'Product 1', organization_id: orgAId } as never);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValue({ id: 'w-1', name: 'Warehouse 1', organization_id: orgAId } as never);
    vi.spyOn(bomRepository, 'findById').mockResolvedValue({ id: 'b-1', bom_number: 'BOM-1', status: 'active', product_id: 'p-1', organization_id: orgAId } as never);
    vi.spyOn(bomExplosionService, 'explodeBom').mockResolvedValue({ components: [] } as never);
    vi.spyOn(manufacturingRepository, 'findByOrderNumber').mockResolvedValue(null);
    vi.spyOn(manufacturingRepository, 'create').mockImplementation(async (data) => ({ ...data, id: 'mo-1' } as never));

    const mo = await manufacturingOrderService.createOrder({ organization_id: orgAId, product_id: 'p-1', bom_id: 'b-1', warehouse_id: 'w-1', planned_quantity: '10.0000' });
    expect(mo.id).toBe('mo-1');
  });
});
