import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingProductionService } from '../src/services/manufacturingProduction.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { manufacturingProductionRepository } from '../src/repositories/manufacturingProduction.repository';
import { manufacturingMaterialConsumptionService } from '../src/services/manufacturingMaterialConsumption.service';
import { inventoryService } from '../src/services/inventory.service';
import { manufacturingOrderStateMachineService } from '../src/services/manufacturingOrderStateMachine.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import {
  ManufacturingOrderNotFoundError,
  ManufacturingOrderNotInProgressError,
  ManufacturingOrderMaterialsNotFullyConsumedError,
  ManufacturingOrderOverProductionError,
  DuplicateManufacturingProductionError,
  ValidationError,
} from '../src/types';
import { ManufacturingOrder } from '../src/types/database';

describe('Manufacturing Production Service (Phase 037)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const moId = 'mo-001';
  const prodId = 'prod-fg-table-001';
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
    completed_quantity: '80.0000',
    produced_quantity: '80.0000',
    scheduled_start_date: null,
    scheduled_end_date: null,
    actual_start_date: new Date(),
    actual_end_date: null,
    status: 'in_progress',
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
      product_id: prodId,
      warehouse_id: whId,
      quantity: '100.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(manufacturingProductionRepository, 'create').mockResolvedValue({
      id: 'prod-rec-001',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      product_id: prodId,
      warehouse_id: whId,
      production_number: 'PROD-0001',
      quantity: '15.0000',
      produced_by: null,
      produced_at: new Date(),
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({
      ...inProgressMo,
      produced_quantity: '95.0000',
      completed_quantity: '95.0000',
    });
    vi.spyOn(manufacturingMaterialConsumptionService, 'isMaterialFullyConsumed').mockResolvedValue(true);
  });

  it('should process valid partial finished goods production successfully', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingProductionRepository, 'findByProductionNumber').mockResolvedValue(null);

    const res = await manufacturingProductionService.produceFinishedGoods(orgAId, moId, {
      production_number: 'PROD-0001',
      quantity: '15.0000',
      notes: 'Partial batch production',
    });

    expect(res.manufacturing_order_id).toBe(moId);
    expect(res.status).toBe('in_progress');
    expect(res.production_complete).toBe(false);
    expect(res.produced_quantity).toBe('95.0000');
    expect(res.remaining_quantity).toBe('5.0000');
  });

  it('should complete MO when final production reaches planned quantity', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingProductionRepository, 'findByProductionNumber').mockResolvedValue(null);
    vi.spyOn(manufacturingOrderStateMachineService, 'transitionState').mockResolvedValue({
      ...inProgressMo,
      status: 'completed',
      produced_quantity: '100.0000',
      completed_quantity: '100.0000',
    });

    const res = await manufacturingProductionService.produceFinishedGoods(orgAId, moId, {
      production_number: 'PROD-FINAL',
      quantity: '20.0000', // 80 + 20 = 100 -> Planned quantity!
    });

    expect(res.status).toBe('completed');
    expect(res.production_complete).toBe(true);
    expect(res.remaining_quantity).toBe('0.0000');
  });

  it('should reject production when MO is not in_progress (e.g. DRAFT, RELEASED, COMPLETED)', async () => {
    const states = ['draft', 'confirmed', 'planned', 'released', 'completed', 'cancelled'] as const;

    for (const st of states) {
      vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({
        ...inProgressMo,
        status: st,
      });

      await expect(
        manufacturingProductionService.produceFinishedGoods(orgAId, moId, {
          production_number: `PROD-${st}`,
          quantity: '10.0000',
        }),
      ).rejects.toThrow(ManufacturingOrderNotInProgressError);
    }
  });

  it('should reject production when materials are not fully consumed (Material Gate)', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingMaterialConsumptionService, 'isMaterialFullyConsumed').mockResolvedValue(false);

    await expect(
      manufacturingProductionService.produceFinishedGoods(orgAId, moId, {
        production_number: 'PROD-GATE',
        quantity: '10.0000',
      }),
    ).rejects.toThrow(ManufacturingOrderMaterialsNotFullyConsumedError);
  });

  it('should reject production exceeding remaining production capacity', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo); // Planned = 100, Produced = 80 -> Remaining = 20

    await expect(
      manufacturingProductionService.produceFinishedGoods(orgAId, moId, {
        production_number: 'PROD-OVER',
        quantity: '21.0000', // 21 > 20
      }),
    ).rejects.toThrow(ManufacturingOrderOverProductionError);
  });

  it('should reject zero or negative production quantity', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);

    await expect(
      manufacturingProductionService.produceFinishedGoods(orgAId, moId, {
        production_number: 'PROD-ZERO',
        quantity: '0.0000',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject duplicate production_number', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingProductionRepository, 'findByProductionNumber').mockResolvedValue({
      id: 'prod-prev',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      product_id: prodId,
      warehouse_id: whId,
      production_number: 'PROD-DUP-01',
      quantity: '10.0000',
      produced_by: null,
      produced_at: new Date(),
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await expect(
      manufacturingProductionService.produceFinishedGoods(orgAId, moId, {
        production_number: 'PROD-DUP-01',
        quantity: '10.0000',
      }),
    ).rejects.toThrow(DuplicateManufacturingProductionError);
  });

  it('should enforce tenant isolation (Tenant B cannot view Tenant A production status)', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === moId) return inProgressMo;
      return null;
    });

    await expect(
      manufacturingProductionService.getProductionStatus(orgBId, moId),
    ).rejects.toThrow(ManufacturingOrderNotFoundError);
  });
});
