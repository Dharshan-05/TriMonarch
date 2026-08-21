import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manufacturingProductionRepository } from '../src/repositories/manufacturingProduction.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';

describe('Manufacturing Production Repository (Phase 037)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const moId = 'mo-001';
  const prodId = 'prod-fg-001';
  const whId = 'wh-001';

  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  } as unknown as PoolClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);
  });

  it('should insert and return production record', async () => {
    const mockRecord = {
      id: 'prod-rec-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      product_id: prodId,
      warehouse_id: whId,
      production_number: 'PROD-0001',
      quantity: '10.0000',
      produced_by: 'user-001',
      produced_at: new Date(),
      notes: 'First batch production',
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(mockClient, 'query').mockResolvedValue({
      rows: [mockRecord],
      rowCount: 1,
    } as never);

    const res = await manufacturingProductionRepository.create(
      {
        organization_id: orgId,
        manufacturing_order_id: moId,
        product_id: prodId,
        warehouse_id: whId,
        production_number: 'PROD-0001',
        quantity: '10.0000',
        produced_by: 'user-001',
        notes: 'First batch production',
      },
      mockClient,
    );

    expect(res.id).toBe('prod-rec-001');
    expect(res.production_number).toBe('PROD-0001');
    expect(res.quantity).toBe('10.0000');
  });

  it('should find record by production_number', async () => {
    const mockRecord = {
      id: 'prod-rec-001',
      organization_id: orgId,
      manufacturing_order_id: moId,
      product_id: prodId,
      warehouse_id: whId,
      production_number: 'PROD-UNIQUE-99',
      quantity: '10.0000',
      produced_by: null,
      produced_at: new Date(),
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(mockClient, 'query').mockResolvedValue({
      rows: [mockRecord],
      rowCount: 1,
    } as never);

    const res = await manufacturingProductionRepository.findByProductionNumber(
      orgId,
      'PROD-UNIQUE-99',
      mockClient,
    );

    expect(res).not.toBeNull();
    expect(res?.production_number).toBe('PROD-UNIQUE-99');
  });
});
