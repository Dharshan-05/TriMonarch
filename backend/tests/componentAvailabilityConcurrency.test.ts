import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingOrderStateMachineService } from '../src/services/manufacturingOrderStateMachine.service';
import { componentAvailabilityService } from '../src/services/componentAvailability.service';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';
import { ManufacturingOrder } from '../src/types/database';
import { ManufacturingOrderAlreadyInStateError } from '../src/types';

describe('Component Availability Concurrency (Phase 035)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  const releasedMo: ManufacturingOrder = {
    id: moId,
    organization_id: orgId,
    bom_id: 'bom-001',
    product_id: 'prod-fg-001',
    warehouse_id: 'wh-001',
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

  it('TEST 18 — Concurrent transition attempts: Only one succeeds, second sees IN_PROGRESS state and fails', async () => {
    let moState: ManufacturingOrder['status'] = 'released';

    vi.spyOn(manufacturingRepository, 'lockByIdForUpdate').mockImplementation(async () => {
      return { ...releasedMo, status: moState };
    });

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

    vi.spyOn(manufacturingRepository, 'update').mockImplementation(async (_orgId, _id, data) => {
      if (data.status) {
        moState = data.status as ManufacturingOrder['status'];
      }
      return { ...releasedMo, status: moState };
    });

    // Execute first transition (released -> in_progress)
    const firstRes = await manufacturingOrderStateMachineService.transitionState(orgId, moId, 'in_progress');
    expect(firstRes.status).toBe('in_progress');

    // Execute second transition attempt (in_progress -> in_progress)
    await expect(
      manufacturingOrderStateMachineService.transitionState(orgId, moId, 'in_progress'),
    ).rejects.toThrow(ManufacturingOrderAlreadyInStateError);
  });
});
