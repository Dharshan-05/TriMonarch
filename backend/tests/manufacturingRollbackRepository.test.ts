import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingRollbackRepository } from '../src/repositories/manufacturingRollback.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';

describe('Manufacturing Rollback Repository (Phase 038)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';
  const itemId = 'item-001';
  const prodId = 'prod-001';
  const whId = 'wh-001';

  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  } as unknown as PoolClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
  });

  it('should insert and return consumption reversal record', async () => {
    const mockRecord = {
      id: 'rev-con-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      manufacturing_material_consumption_id: null,
      manufacturing_order_item_id: itemId,
      product_id: prodId,
      warehouse_id: whId,
      reversal_number: 'REV-CON-001',
      quantity: '5.0000',
      reversed_by: 'user-001',
      reversed_at: new Date(),
      reason: 'Quality defective material returned',
      created_at: new Date(),
    };

    vi.spyOn(mockClient, 'query').mockResolvedValue({
      rows: [mockRecord],
      rowCount: 1,
    } as never);

    const res = await manufacturingRollbackRepository.createConsumptionReversal(
      {
        organization_id: orgId,
        manufacturing_order_id: moId,
        manufacturing_order_item_id: itemId,
        product_id: prodId,
        warehouse_id: whId,
        reversal_number: 'REV-CON-001',
        quantity: '5.0000',
        reversed_by: 'user-001',
        reason: 'Quality defective material returned',
      },
      mockClient,
    );

    expect(res.id).toBe('rev-con-001');
    expect(res.reversal_number).toBe('REV-CON-001');
    expect(res.quantity).toBe('5.0000');
  });

  it('should insert and return production reversal record', async () => {
    const mockRecord = {
      id: 'rev-prod-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      manufacturing_production_id: null,
      product_id: prodId,
      warehouse_id: whId,
      reversal_number: 'REV-PROD-001',
      quantity: '2.0000',
      reversed_by: null,
      reversed_at: new Date(),
      reason: 'Scrapped production batch',
      created_at: new Date(),
    };

    vi.spyOn(mockClient, 'query').mockResolvedValue({
      rows: [mockRecord],
      rowCount: 1,
    } as never);

    const res = await manufacturingRollbackRepository.createProductionReversal(
      {
        organization_id: orgId,
        manufacturing_order_id: moId,
        product_id: prodId,
        warehouse_id: whId,
        reversal_number: 'REV-PROD-001',
        quantity: '2.0000',
        reason: 'Scrapped production batch',
      },
      mockClient,
    );

    expect(res.id).toBe('rev-prod-001');
    expect(res.reversal_number).toBe('REV-PROD-001');
  });
});
