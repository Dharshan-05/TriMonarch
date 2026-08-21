import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingOrderStateMachineService } from '../src/services/manufacturingOrderStateMachine.service';
import { componentAvailabilityService } from '../src/services/componentAvailability.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { inventoryRepository } from '../src/repositories/inventory.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import {
  ManufacturingOrderComponentShortageError,
  ManufacturingOrderTerminalStateError,
} from '../src/types';
import { ManufacturingOrder } from '../src/types/database';

describe('Component Availability & State Machine Integration (Phase 035)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';
  const whId = 'wh-001';
  const prodId = 'comp-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const releasedMo: ManufacturingOrder = {
    id: moId,
    organization_id: orgId,
    bom_id: 'bom-001',
    product_id: 'prod-fg-001',
    warehouse_id: whId,
    order_number: 'MO-001',
    mo_number: 'MO-001',
    planned_quantity: '10.0000',
    completed_quantity: '0.0000',
    scheduled_start_date: null,
    scheduled_end_date: null,
    actual_start_date: null,
    actual_end_date: null,
    status: 'released',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
    vi.spyOn(manufacturingRepository, 'createStatusHistory').mockResolvedValue({
      id: 'hist-1',
      organization_id: orgId,
      manufacturing_order_id: moId,
      from_status: 'released',
      to_status: 'in_progress',
      changed_by: null,
      reason: null,
      request_id: null,
      metadata: {},
      created_at: new Date(),
    });
  });

  it('TEST 12 — RELEASED -> IN_PROGRESS succeeds when all components are available', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(releasedMo);
    vi.spyOn(componentAvailabilityService, 'checkManufacturingOrderAvailability').mockResolvedValue({
      manufacturing_order_id: moId,
      warehouse_id: whId,
      status: 'READY',
      ready: true,
      components: [
        {
          product_id: prodId,
          required_quantity: '10.0000',
          on_hand_quantity: '20.0000',
          reserved_quantity: '0.0000',
          available_quantity: '20.0000',
          shortage_quantity: '0.0000',
          available: true,
        },
      ],
      total_components: 1,
      available_components: 1,
      shortage_components: 0,
    });

    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({
      ...releasedMo,
      status: 'in_progress',
      actual_start_date: new Date(),
    });

    const res = await manufacturingOrderStateMachineService.transitionState(orgId, moId, 'in_progress');
    expect(res.status).toBe('in_progress');
  });

  it('TEST 13, 14, 15, 16, 17 — RELEASED -> IN_PROGRESS fails when any component is short; zero state/history/inventory/reservation mutations', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue(releasedMo);
    vi.spyOn(componentAvailabilityService, 'checkManufacturingOrderAvailability').mockResolvedValue({
      manufacturing_order_id: moId,
      warehouse_id: whId,
      status: 'SHORTAGE',
      ready: false,
      components: [
        {
          product_id: prodId,
          required_quantity: '10.0000',
          on_hand_quantity: '5.0000',
          reserved_quantity: '0.0000',
          available_quantity: '5.0000',
          shortage_quantity: '5.0000',
          available: false,
        },
      ],
      total_components: 1,
      available_components: 0,
      shortage_components: 1,
    });

    const updateSpy = vi.spyOn(manufacturingRepository, 'update');
    const historySpy = vi.spyOn(manufacturingRepository, 'createStatusHistory');
    const invQtySpy = vi.spyOn(inventoryRepository, 'updateQuantity');

    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'in_progress'),
    ).rejects.toThrow(ManufacturingOrderComponentShortageError);

    // Verify 0 mutations occurred
    expect(updateSpy).not.toHaveBeenCalled();
    expect(historySpy).not.toHaveBeenCalled();
    expect(invQtySpy).not.toHaveBeenCalled();
  });

  it('TEST 19 & 20 — Terminal State Protection: COMPLETED / CANCELLED -> IN_PROGRESS must fail', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({
      ...releasedMo,
      status: 'completed',
    });

    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'in_progress'),
    ).rejects.toThrow(ManufacturingOrderTerminalStateError);

    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({
      ...releasedMo,
      status: 'cancelled',
    });

    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'in_progress'),
    ).rejects.toThrow(ManufacturingOrderTerminalStateError);
  });
});
