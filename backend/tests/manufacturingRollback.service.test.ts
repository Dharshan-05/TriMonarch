import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingRollbackService } from '../src/services/manufacturingRollback.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { manufacturingRollbackRepository } from '../src/repositories/manufacturingRollback.repository';
import { inventoryService } from '../src/services/inventory.service';
import { manufacturingOrderStateMachineService } from '../src/services/manufacturingOrderStateMachine.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import {
  ManufacturingOrderNotFoundError,
  ManufacturingMaterialReversalExceedsConsumedError,
  ManufacturingProductionReversalExceedsProducedError,
  ManufacturingOrderCancellationWithActiveProductionError,
} from '../src/types';
import { ManufacturingOrder } from '../src/types/database';

describe('Manufacturing Rollback Service (Phase 038)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const moId = 'mo-001';
  const itemId = 'item-001';
  const compId = 'comp-001';
  const prodId = 'prod-fg-001';
  const whId = 'wh-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const inProgressMo: ManufacturingOrder = {
    id: moId,
    organization_id: orgAId,
    bom_id: 'bom-001',
    product_id: prodId,
    warehouse_id: whId,
    order_number: 'MO-001',
    mo_number: 'MO-001',
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
    consumed_quantity: '30.0000',
    unit: 'pcs',
    sequence: 1,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
    vi.spyOn(inventoryService, 'increaseStock').mockResolvedValue({
      id: 'inv-001',
      organization_id: orgAId,
      product_id: compId,
      warehouse_id: whId,
      quantity: '100.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(inventoryService, 'decreaseStock').mockResolvedValue({
      id: 'inv-002',
      organization_id: orgAId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '50.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(manufacturingRollbackRepository, 'createConsumptionReversal').mockResolvedValue({
      id: 'rev-c-001',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      manufacturing_material_consumption_id: null,
      manufacturing_order_item_id: itemId,
      product_id: compId,
      warehouse_id: whId,
      reversal_number: 'REV-C-001',
      quantity: '10.0000',
      reversed_by: null,
      reversed_at: new Date(),
      reason: null,
      created_at: new Date(),
    });
    vi.spyOn(manufacturingRollbackRepository, 'createProductionReversal').mockResolvedValue({
      id: 'rev-p-001',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      manufacturing_production_id: null,
      product_id: prodId,
      warehouse_id: whId,
      reversal_number: 'REV-P-001',
      quantity: '5.0000',
      reversed_by: null,
      reversed_at: new Date(),
      reason: null,
      created_at: new Date(),
    });
    vi.spyOn(manufacturingRepository, 'updateItem').mockResolvedValue({ ...baseItem, consumed_quantity: '20.0000' });
    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue(inProgressMo);
  });

  it('should reverse material consumption successfully and restore component stock', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingRepository, 'findItemById').mockResolvedValue(baseItem);
    vi.spyOn(manufacturingRollbackRepository, 'findConsumptionReversalByNumber').mockResolvedValue(null);

    const res = await manufacturingRollbackService.reverseMaterialConsumption(orgAId, moId, {
      manufacturing_order_item_id: itemId,
      reversal_number: 'REV-C-001',
      quantity: '10.0000',
      reason: 'Material defect',
    });

    expect(res.manufacturing_order_id).toBe(moId);
    expect(res.previous_consumed_quantity).toBe('30.0000');
    expect(res.new_consumed_quantity).toBe('20.0000');
  });

  it('should reject material reversal exceeding consumed quantity', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingRepository, 'findItemById').mockResolvedValue(baseItem); // Consumed = 30

    await expect(
      manufacturingRollbackService.reverseMaterialConsumption(orgAId, moId, {
        manufacturing_order_item_id: itemId,
        reversal_number: 'REV-OVER',
        quantity: '31.0000', // 31 > 30
      }),
    ).rejects.toThrow(ManufacturingMaterialReversalExceedsConsumedError);
  });

  it('should reverse finished goods production successfully and reduce finished goods stock', async () => {
    const moWithProd = { ...inProgressMo, produced_quantity: '20.0000', completed_quantity: '20.0000' };
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(moWithProd);
    vi.spyOn(manufacturingRollbackRepository, 'findProductionReversalByNumber').mockResolvedValue(null);

    const res = await manufacturingRollbackService.reverseFinishedGoodsProduction(orgAId, moId, {
      reversal_number: 'REV-P-001',
      quantity: '5.0000',
      reason: 'Production defect',
    });

    expect(res.manufacturing_order_id).toBe(moId);
    expect(res.previous_produced_quantity).toBe('20.0000');
    expect(res.new_produced_quantity).toBe('15.0000');
  });

  it('should reject production reversal exceeding produced quantity', async () => {
    const moWithProd = { ...inProgressMo, produced_quantity: '20.0000', completed_quantity: '20.0000' };
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(moWithProd);

    await expect(
      manufacturingRollbackService.reverseFinishedGoodsProduction(orgAId, moId, {
        reversal_number: 'REV-PROD-OVER',
        quantity: '25.0000', // 25 > 20
      }),
    ).rejects.toThrow(ManufacturingProductionReversalExceedsProducedError);
  });

  it('should reject MO cancellation if finished goods have been produced', async () => {
    const moWithProd = { ...inProgressMo, produced_quantity: '10.0000', completed_quantity: '10.0000' };
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(moWithProd);

    await expect(
      manufacturingRollbackService.cancelOrderWithReversal(orgAId, moId, 'Cancelling MO'),
    ).rejects.toThrow(ManufacturingOrderCancellationWithActiveProductionError);
  });

  it('should cancel MO and automatically reverse consumed component materials', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([baseItem]);
    vi.spyOn(manufacturingOrderStateMachineService, 'transitionState').mockResolvedValue({
      ...inProgressMo,
      status: 'cancelled',
    });

    const cancelled = await manufacturingRollbackService.cancelOrderWithReversal(orgAId, moId, 'Order cancelled by user');

    expect(cancelled.status).toBe('cancelled');
  });

  it('should enforce tenant isolation (Tenant B cannot reverse Tenant A consumption)', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === moId) return inProgressMo;
      return null;
    });

    await expect(
      manufacturingRollbackService.getConsumptionReversals(orgBId, moId),
    ).rejects.toThrow(ManufacturingOrderNotFoundError);
  });
});
