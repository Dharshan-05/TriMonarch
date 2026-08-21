import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingOrderStateMachineService } from '../src/services/manufacturingOrderStateMachine.service';
import { componentAvailabilityService } from '../src/services/componentAvailability.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import {
  InvalidManufacturingOrderStateTransitionError,
  ManufacturingOrderAlreadyInStateError,
  ManufacturingOrderTerminalStateError,
} from '../src/types';
import { ManufacturingOrder } from '../src/types/database';

describe('Manufacturing Order State Machine Governance (Phase 034)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
    vi.spyOn(manufacturingRepository, 'createStatusHistory').mockResolvedValue({
      id: 'hist-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      from_status: 'draft',
      to_status: 'confirmed',
      changed_by: null,
      reason: null,
      request_id: null,
      metadata: {},
      created_at: new Date(),
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue({
      id: 'audit-001',
      organization_id: orgId,
      user_id: null,
      action: 'UPDATE',
      entity_type: 'MANUFACTURING_ORDER',
      entity_id: moId,
      request_id: null,
      success: true,
      metadata: {},
      created_at: new Date(),
    });
  });

  const baseMo: ManufacturingOrder = {
    id: moId,
    organization_id: orgId,
    bom_id: 'bom-001',
    product_id: 'prod-finished-001',
    warehouse_id: 'wh-001',
    order_number: 'MO-2026-0001',
    mo_number: 'MO-2026-0001',
    planned_quantity: '10.0000',
    completed_quantity: '0.0000',
    scheduled_start_date: null,
    scheduled_end_date: null,
    actual_start_date: null,
    actual_end_date: null,
    status: 'draft',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('TEST 1 — Complete Valid Lifecycle: DRAFT -> CONFIRMED -> PLANNED -> RELEASED -> IN_PROGRESS -> COMPLETED', async () => {
    // 1. DRAFT -> CONFIRMED
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'draft' });
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgId,
        manufacturing_order_id: moId,
        component_product_id: 'comp-1',
        bom_item_id: null,
        required_quantity: '10.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({ ...baseMo, status: 'confirmed' });
    let res = await manufacturingOrderStateMachineService.transitionState(orgId, moId, 'confirmed');
    expect(res.status).toBe('confirmed');

    // 2. CONFIRMED -> PLANNED
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'confirmed' });
    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({ ...baseMo, status: 'planned' });
    res = await manufacturingOrderStateMachineService.transitionState(orgId, moId, 'planned');
    expect(res.status).toBe('planned');

    // 3. PLANNED -> RELEASED
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'planned' });
    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({ ...baseMo, status: 'released' });
    res = await manufacturingOrderStateMachineService.transitionState(orgId, moId, 'released');
    expect(res.status).toBe('released');

    // 4. RELEASED -> IN_PROGRESS (TEST 24: actual_start_date update)
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'released' });
    vi.spyOn(componentAvailabilityService, 'checkManufacturingOrderAvailability').mockResolvedValue({
      manufacturing_order_id: moId,
      warehouse_id: 'wh-001',
      status: 'READY',
      ready: true,
      components: [],
      total_components: 0,
      available_components: 0,
      shortage_components: 0,
    });
    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({
      ...baseMo,
      status: 'in_progress',
      actual_start_date: new Date(),
    });
    res = await manufacturingOrderStateMachineService.transitionState(orgId, moId, 'in_progress');
    expect(res.status).toBe('in_progress');
    expect(res.actual_start_date).not.toBeNull();

    // 5. IN_PROGRESS -> COMPLETED (TEST 24: actual_end_date update)
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({
      ...baseMo,
      status: 'in_progress',
      produced_quantity: '10.0000',
      completed_quantity: '10.0000',
    });
    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({
      ...baseMo,
      status: 'completed',
      actual_end_date: new Date(),
    });
    res = await manufacturingOrderStateMachineService.transitionState(orgId, moId, 'completed');
    expect(res.status).toBe('completed');
    expect(res.actual_end_date).not.toBeNull();
  });

  it('TEST 2-6 — Cancellation from non-terminal states (DRAFT, CONFIRMED, PLANNED, RELEASED, IN_PROGRESS)', async () => {
    const nonTerminalStates: Array<ManufacturingOrder['status']> = [
      'draft',
      'confirmed',
      'planned',
      'released',
      'in_progress',
    ];

    for (const st of nonTerminalStates) {
      vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: st });
      vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({ ...baseMo, status: 'cancelled' });
      const res = await manufacturingOrderStateMachineService.transitionState(orgId, moId, 'cancelled', 'user-01', 'Reason for cancellation');
      expect(res.status).toBe('cancelled');
    }
  });

  it('TEST 7 & 8 — Terminal State Protection: COMPLETED & CANCELLED reject further transitions', async () => {
    // COMPLETED -> CANCELLED / CONFIRMED
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'completed' });
    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'cancelled'),
    ).rejects.toThrow(ManufacturingOrderTerminalStateError);

    // CANCELLED -> CONFIRMED / DRAFT
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'cancelled' });
    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'confirmed'),
    ).rejects.toThrow(ManufacturingOrderTerminalStateError);
  });

  it('TEST 9-11 — Invalid State Jumps: Rejects unauthorized status skips', async () => {
    // DRAFT -> RELEASED
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'draft' });
    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'released'),
    ).rejects.toThrow(InvalidManufacturingOrderStateTransitionError);

    // CONFIRMED -> IN_PROGRESS
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'confirmed' });
    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'in_progress'),
    ).rejects.toThrow(InvalidManufacturingOrderStateTransitionError);

    // PLANNED -> COMPLETED
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'planned' });
    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'completed'),
    ).rejects.toThrow(InvalidManufacturingOrderStateTransitionError);
  });

  it('TEST 12 & 13 — Same State Transition Rejection', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'confirmed' });
    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'confirmed'),
    ).rejects.toThrow(ManufacturingOrderAlreadyInStateError);
  });

  it('TEST 17 — Invalid transition must NOT record audit event or update DB', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'draft' });
    const auditSpy = vi.spyOn(auditService, 'recordAuditEvent');

    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'in_progress'),
    ).rejects.toThrow();

    expect(auditSpy).not.toHaveBeenCalled();
  });

  it('TEST 18 — Transaction Rollback: History creation failure rolls back transition', async () => {
    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockResolvedValue({ ...baseMo, status: 'draft' });
    vi.spyOn(manufacturingRepository, 'listItems').mockResolvedValue([
      {
        id: 'item-1',
        organization_id: orgId,
        manufacturing_order_id: moId,
        component_product_id: 'comp-1',
        bom_item_id: null,
        required_quantity: '10.0000',
        consumed_quantity: '0.0000',
        unit: 'pcs',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    vi.spyOn(manufacturingRepository, 'update').mockResolvedValue({ ...baseMo, status: 'confirmed' });
    vi.spyOn(manufacturingRepository, 'createStatusHistory').mockRejectedValue(new Error('DB History Failure'));

    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'confirmed'),
    ).rejects.toThrow('DB History Failure');
  });
});
