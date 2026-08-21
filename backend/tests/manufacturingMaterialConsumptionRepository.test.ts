import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingMaterialConsumptionRepository } from '../src/repositories/manufacturingMaterialConsumption.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';

describe('Manufacturing Material Consumption Repository (Phase 036)', () => {
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

  it('should insert and return consumption record', async () => {
    const mockRecord = {
      id: 'cons-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      manufacturing_order_item_id: itemId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '5.0000',
      consumed_at: new Date(),
      consumed_by: 'user-001',
      reference_number: 'CONSUME-001',
      notes: 'Test consumption',
      created_at: new Date(),
    };

    vi.spyOn(mockClient, 'query').mockResolvedValue({
      rows: [mockRecord],
      rowCount: 1,
    } as never);

    const res = await manufacturingMaterialConsumptionRepository.create(
      {
        organization_id: orgId,
        manufacturing_order_id: moId,
        manufacturing_order_item_id: itemId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '5.0000',
        consumed_by: 'user-001',
        reference_number: 'CONSUME-001',
        notes: 'Test consumption',
      },
      mockClient,
    );

    expect(res.id).toBe('cons-001');
    expect(res.quantity).toBe('5.0000');
  });

  it('should find record by reference number', async () => {
    const mockRecord = {
      id: 'cons-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      manufacturing_order_item_id: itemId,
      product_id: prodId,
      warehouse_id: whId,
      quantity: '5.0000',
      consumed_at: new Date(),
      consumed_by: null,
      reference_number: 'CONSUME-REF-99',
      notes: null,
      created_at: new Date(),
    };

    vi.spyOn(mockClient, 'query').mockResolvedValue({
      rows: [mockRecord],
      rowCount: 1,
    } as never);

    const res = await manufacturingMaterialConsumptionRepository.findByReferenceNumber(
      orgId,
      'CONSUME-REF-99',
      mockClient,
    );

    expect(res).not.toBeNull();
    expect(res?.reference_number).toBe('CONSUME-REF-99');
  });
});
