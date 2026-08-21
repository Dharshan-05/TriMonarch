import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingRollbackService } from '../src/services/manufacturingRollback.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { manufacturingRollbackRepository } from '../src/repositories/manufacturingRollback.repository';
import { inventoryService } from '../src/services/inventory.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { ManufacturingOrder } from '../src/types/database';

describe('Manufacturing Rollback Concurrency & Failure Injection (Phase 038)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-concur-001';
  const itemId = 'item-concur-001';
  const compId = 'comp-001';
  const whId = 'wh-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const inProgressMo: ManufacturingOrder = {
    id: moId,
    organization_id: orgAId,
    bom_id: 'bom-001',
    product_id: 'prod-fg-001',
    warehouse_id: whId,
    order_number: 'MO-CONCUR-001',
    mo_number: 'MO-CONCUR-001',
    planned_quantity: '100.0000',
    completed_quantity: '0.0000',
    produced_quantity: '0.0000',
    scheduled_start_date: null,
    scheduled_end_date: null,
    actual_start_date: new Date(),
    actual_end_date: null,
    status: 'in_progress',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const baseItem = {
    id: itemId,
    organization_id: orgAId,
    manufacturing_order_id: moId,
    component_product_id: compId,
    bom_item_id: null,
    required_quantity: '100.0000',
    consumed_quantity: '50.0000',
    unit: 'pcs',
    sequence: 1,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
  });

  it('FAILURE INJECTION: Database rollback when inventory restoration fails', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingRepository, 'findItemById').mockResolvedValue(baseItem);
    vi.spyOn(manufacturingRollbackRepository, 'findConsumptionReversalByNumber').mockResolvedValue(null);

    // Simulate inventory service throwing DB connection failure during restoration
    vi.spyOn(inventoryService, 'increaseStock').mockRejectedValue(new Error('Database connectivity error'));

    await expect(
      manufacturingRollbackService.reverseMaterialConsumption(orgAId, moId, {
        manufacturing_order_item_id: itemId,
        reversal_number: 'REV-CONCUR-FAIL',
        quantity: '10.0000',
      }),
    ).rejects.toThrow('Database connectivity error');
  });
});
