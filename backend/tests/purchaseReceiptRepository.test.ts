import { describe, it, expect, vi } from 'vitest';
import { purchaseReceiptRepository } from '../src/repositories/purchaseReceipt.repository';
import { PoolClient } from 'pg';

describe('Purchase Receipt Repository Subsystem (Phase 029)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const poId = '77777777-7777-7777-7777-777777777777';
  const whId = '88888888-8888-8888-8888-888888888888';
  const receiptId = '99999999-9999-9999-9999-999999999999';

  const mockReceipt = {
    id: receiptId,
    organization_id: orgAId,
    purchase_order_id: poId,
    receipt_number: 'REC-100001',
    warehouse_id: whId,
    status: 'draft' as const,
    receipt_date: new Date(),
    received_at: null,
    cancelled_at: null,
    notes: 'Test receipt notes',
    created_by: null,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createMockPoolClient = (overrideRows?: Record<string, unknown>[]) => {
    const mockQuery = vi.fn().mockImplementation(async (sql: string, params?: unknown[]) => {
      if (params && params.includes(orgBId)) {
        return { rows: [], rowCount: 0, command: sql, oid: 0, fields: [] };
      }
      return {
        rows: overrideRows !== undefined ? overrideRows : [mockReceipt],
        rowCount: (overrideRows !== undefined ? overrideRows : [mockReceipt]).length,
        command: sql,
        oid: 0,
        fields: [],
      };
    });
    const mockRelease = vi.fn();
    return {
      query: mockQuery,
      release: mockRelease,
    } as unknown as PoolClient;
  };

  it('should create a new purchase receipt header with organization scoping', async () => {
    const mockClient = createMockPoolClient();

    const result = await purchaseReceiptRepository.create(
      {
        organization_id: orgAId,
        purchase_order_id: poId,
        receipt_number: 'REC-100001',
        warehouse_id: whId,
      },
      mockClient,
    );

    expect(result.id).toBe(receiptId);
    expect(result.receipt_number).toBe('REC-100001');
  });

  it('should retrieve receipt by ID and enforce organization isolation', async () => {
    const mockClient = createMockPoolClient();

    const foundOrgA = await purchaseReceiptRepository.findById(orgAId, receiptId, mockClient);
    expect(foundOrgA).not.toBeNull();

    const foundOrgB = await purchaseReceiptRepository.findById(orgBId, receiptId, mockClient);
    expect(foundOrgB).toBeNull();
  });

  it('should acquire FOR UPDATE row lock via lockByIdForUpdate', async () => {
    const mockClient = createMockPoolClient();

    const locked = await purchaseReceiptRepository.lockByIdForUpdate(orgAId, receiptId, mockClient);
    expect(locked).not.toBeNull();
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      [receiptId, orgAId],
    );
  });

  it('should sum received quantities for a purchase order item from posted/completed receipts', async () => {
    const mockClient = createMockPoolClient([{ total_received: '40.0000' }]);

    const total = await purchaseReceiptRepository.getReceivedQuantityForPurchaseOrderItem(
      orgAId,
      'po-item-123',
      mockClient,
    );

    expect(total).toBe('40.0000');
  });
});
