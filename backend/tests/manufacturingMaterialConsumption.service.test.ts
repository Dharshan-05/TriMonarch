import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingMaterialConsumptionService } from '../src/services/manufacturingMaterialConsumption.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { manufacturingMaterialConsumptionRepository } from '../src/repositories/manufacturingMaterialConsumption.repository';
import { inventoryService } from '../src/services/inventory.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import {
  ManufacturingOrderNotFoundError,
  ManufacturingOrderNotInProgressError,
  ManufacturingMaterialOverConsumptionError,
  DuplicateManufacturingConsumptionError,
  ValidationError,
  InsufficientStockError,
} from '../src/types';
import { ManufacturingOrder } from '../src/types/database';

describe('Manufacturing Material Consumption Service (Phase 036)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const moId = 'mo-001';
  const itemId = 'item-001';
  const prodId = 'prod-comp-001';
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
    order_number: 'MO-001',
    mo_number: 'MO-001',
    planned_quantity: '10.0000',
    completed_quantity: '0.0000',
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
    component_product_id: prodId,
    bom_item_id: null,
    required_quantity: '10.0000',
    consumed_quantity: '3.0000',
    unit: 'pcs',
    sequence: 1,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
    vi.spyOn(inventoryService, 'decreaseStock').mockResolvedValue({
      id: 'inv-001',
      organization_id: orgAId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '100.0000',
      reorder_level: '0.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(manufacturingMaterialConsumptionRepository, 'create').mockResolvedValue({
      id: 'cons-001',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      manufacturing_order_item_id: itemId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '5.0000',
      consumed_at: new Date(),
      consumed_by: null,
      reference_number: null,
      notes: null,
      created_at: new Date(),
    });
    vi.spyOn(manufacturingRepository, 'updateItem').mockResolvedValue(baseItem);
  });

  it('should process valid material consumption successfully', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingRepository, 'findItemById').mockResolvedValue(baseItem);
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      { ...baseItem, consumed_quantity: '8.0000' },
    ]);
    vi.spyOn(manufacturingMaterialConsumptionRepository, 'findByReferenceNumber').mockResolvedValue(null);

    const res = await manufacturingMaterialConsumptionService.consumeMaterials(orgAId, moId, {
      items: [{ manufacturing_order_item_id: itemId, quantity: '5.0000' }],
      notes: 'Testing material consumption',
    });

    expect(res.manufacturing_order_id).toBe(moId);
    expect(res.status).toBe('in_progress');
    expect(res.items[0]!.consumed_quantity).toBe('8.0000');
    expect(res.items[0]!.remaining_quantity).toBe('2.0000');
    expect(res.material_consumption_complete).toBe(false);
  });

  it('should reject material consumption if MO is not in_progress (e.g. released)', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({
      ...inProgressMo,
      status: 'released',
    });

    await expect(
      manufacturingMaterialConsumptionService.consumeMaterials(orgAId, moId, {
        items: [{ manufacturing_order_item_id: itemId, quantity: '5.0000' }],
      }),
    ).rejects.toThrow(ManufacturingOrderNotInProgressError);
  });

  it('should reject over-consumption when requested > remaining', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingRepository, 'findItemById').mockResolvedValue(baseItem); // required: 10, consumed: 3 -> remaining: 7

    await expect(
      manufacturingMaterialConsumptionService.consumeMaterials(orgAId, moId, {
        items: [{ manufacturing_order_item_id: itemId, quantity: '8.0000' }], // 8 > 7
      }),
    ).rejects.toThrow(ManufacturingMaterialOverConsumptionError);
  });

  it('should reject zero or negative consumption quantity', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingRepository, 'findItemById').mockResolvedValue(baseItem);

    await expect(
      manufacturingMaterialConsumptionService.consumeMaterials(orgAId, moId, {
        items: [{ manufacturing_order_item_id: itemId, quantity: '0.0000' }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject duplicate item IDs in batch consumption request', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);

    await expect(
      manufacturingMaterialConsumptionService.consumeMaterials(orgAId, moId, {
        items: [
          { manufacturing_order_item_id: itemId, quantity: '2.0000' },
          { manufacturing_order_item_id: itemId, quantity: '3.0000' },
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject duplicate reference_number', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingMaterialConsumptionRepository, 'findByReferenceNumber').mockResolvedValue({
      id: 'cons-prev',
      organization_id: orgAId,
      manufacturing_order_id: moId,
      manufacturing_order_item_id: itemId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '1.0000',
      consumed_at: new Date(),
      consumed_by: null,
      reference_number: 'REF-DUP-01',
      notes: null,
      created_at: new Date(),
    });

    await expect(
      manufacturingMaterialConsumptionService.consumeMaterials(orgAId, moId, {
        items: [{ manufacturing_order_item_id: itemId, quantity: '1.0000' }],
        reference_number: 'REF-DUP-01',
      }),
    ).rejects.toThrow(DuplicateManufacturingConsumptionError);
  });

  it('should rollback transaction if inventory stock decrease fails (e.g. InsufficientStockError)', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(inProgressMo);
    vi.spyOn(manufacturingRepository, 'findItemById').mockResolvedValue(baseItem);
    vi.spyOn(inventoryService, 'decreaseStock').mockRejectedValue(new InsufficientStockError('Stock unavailable'));

    await expect(
      manufacturingMaterialConsumptionService.consumeMaterials(orgAId, moId, {
        items: [{ manufacturing_order_item_id: itemId, quantity: '5.0000' }],
      }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it('should enforce tenant isolation (Tenant B cannot access Tenant A MO)', async () => {
    vi.spyOn(manufacturingRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === moId) return inProgressMo;
      return null;
    });

    await expect(
      manufacturingMaterialConsumptionService.getConsumptionHistory(orgBId, moId),
    ).rejects.toThrow(ManufacturingOrderNotFoundError);
  });
});
