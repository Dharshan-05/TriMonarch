import { describe, it, expect, vi } from 'vitest';
import { purchaseReceiptStateMachineService } from '../src/services/purchaseReceiptStateMachine.service';
import { purchaseReceiptRepository } from '../src/repositories/purchaseReceipt.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  InvalidPurchaseReceiptStateTransitionError,
  PurchaseReceiptAlreadyPostedError,
} from '../src/types';
import { PoolClient } from 'pg';
import { PurchaseReceipt, AuditLog } from '../src/types/database';

describe('Purchase Receipt State Machine (Phase 029)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const receiptId = '99999999-9999-9999-9999-999999999999';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockReceipt: PurchaseReceipt = {
    id: receiptId,
    organization_id: orgAId,
    purchase_order_id: '77777777-7777-7777-7777-777777777777',
    receipt_number: 'REC-100001',
    warehouse_id: '88888888-8888-8888-8888-888888888888',
    status: 'draft',
    receipt_date: new Date(),
    received_at: null,
    cancelled_at: null,
    notes: null,
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('should validate allowed state transitions correctly', () => {
    expect(purchaseReceiptStateMachineService.canTransition('draft', 'posted')).toBe(true);
    expect(purchaseReceiptStateMachineService.canTransition('draft', 'cancelled')).toBe(true);
    expect(purchaseReceiptStateMachineService.canTransition('posted', 'completed')).toBe(true);
    expect(purchaseReceiptStateMachineService.canTransition('posted', 'cancelled')).toBe(false);
    expect(purchaseReceiptStateMachineService.canTransition('completed', 'draft')).toBe(false);
  });

  it('should reject double posting of a receipt', async () => {
    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockReceipt,
      status: 'posted',
    });

    await expect(
      purchaseReceiptStateMachineService.transitionReceipt(orgAId, receiptId, 'posted', userAId),
    ).rejects.toThrow(PurchaseReceiptAlreadyPostedError);
  });

  it('should reject cancelling a posted receipt', async () => {
    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockReceipt,
      status: 'posted',
    });

    await expect(
      purchaseReceiptStateMachineService.transitionReceipt(orgAId, receiptId, 'cancelled', userAId),
    ).rejects.toThrow(InvalidPurchaseReceiptStateTransitionError);
  });

  it('should complete a posted receipt successfully', async () => {
    vi.spyOn(purchaseReceiptRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockReceipt,
      status: 'posted',
    });
    vi.spyOn(purchaseReceiptRepository, 'update').mockResolvedValueOnce({
      ...mockReceipt,
      status: 'completed',
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const completed = await purchaseReceiptStateMachineService.transitionReceipt(
      orgAId,
      receiptId,
      'completed',
      userAId,
    );

    expect(completed.status).toBe('completed');
  });
});
