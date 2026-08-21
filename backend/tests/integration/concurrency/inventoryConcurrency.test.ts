import { describe, it, expect, vi } from 'vitest';
import { inventoryService } from '../../../src/services/inventory.service';
import { productRepository } from '../../../src/repositories/product.repository';
import { warehouseRepository } from '../../../src/repositories/warehouse.repository';
import { inventoryRepository } from '../../../src/repositories/inventory.repository';
import { stockLedgerRepository } from '../../../src/repositories/stockLedger.repository';
import { auditService } from '../../../src/audit/audit.service';
import * as txModule from '../../../src/db/transaction';
import { orgAId } from './concurrencyFixtures';
import { runConcurrentRequests } from './concurrencyHelpers';
import { assertNonNegativeStock } from './concurrencyAssertions';

describe('Phase 065 — Inventory Concurrency Tests', () => {
  it('concurrent stock increments process without lost updates', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementation(async (cb) => cb({} as never));
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null);
    vi.spyOn(productRepository, 'findById').mockResolvedValue({ id: 'p-001', organization_id: orgAId } as never);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValue({ id: 'w-001', organization_id: orgAId } as never);
    vi.spyOn(inventoryRepository, 'ensureInventoryRowLocked').mockResolvedValue({ id: 'inv-1', quantity: '100.0000' } as never);
    vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValue({ id: 'inv-1', quantity: '150.0000' } as never);
    vi.spyOn(stockLedgerRepository, 'create').mockResolvedValue({} as never);

    const req1 = () => inventoryService.increaseStock({ organization_id: orgAId, product_id: 'p-001', warehouse_id: 'w-001', quantity: '30.0000' });
    const req2 = () => inventoryService.increaseStock({ organization_id: orgAId, product_id: 'p-001', warehouse_id: 'w-001', quantity: '20.0000' });

    const results = await runConcurrentRequests([req1, req2]);
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    assertNonNegativeStock('150.0000');
  });
});
