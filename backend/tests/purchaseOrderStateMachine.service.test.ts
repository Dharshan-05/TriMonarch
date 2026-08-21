import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderStateMachineService } from '../src/services/purchaseOrderStateMachine.service';
import { purchaseOrderRepository } from '../src/repositories/purchaseOrder.repository';
import { auditService } from '../src/audit/audit.service';
import {
  PurchaseOrderNotFoundError,
  InvalidPurchaseOrderStateTransitionError,
  PurchaseOrderAlreadyInStateError,
} from '../src/types';
import { PoolClient } from 'pg';
import { pool } from '../src/config/database';
import { PurchaseOrder } from '../src/types/database';

describe('Purchase Order State Machine (Phase 028)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const poId = '99999999-9999-9999-9999-999999999999';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockPO: PurchaseOrder = {
    id: poId,
    organization_id: orgAId,
    supplier_id: '44444444-4444-4444-4444-444444444444',
    warehouse_id: '55555555-5555-5555-5555-555555555555',
    order_number: 'PO-100001',
    order_date: new Date(),
    expected_delivery_date: null,
    status: 'draft',
    currency: 'USD',
    subtotal: '100.0000',
    tax_amount: '0.0000',
    discount_amount: '0.0000',
    total_amount: '100.0000',
    notes: 'Test PO',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('should validate allowed state transitions correctly', () => {
    expect(purchaseOrderStateMachineService.canTransition('draft', 'submitted')).toBe(true);
    expect(purchaseOrderStateMachineService.canTransition('draft', 'cancelled')).toBe(true);
    expect(purchaseOrderStateMachineService.canTransition('draft', 'approved')).toBe(false);
    expect(purchaseOrderStateMachineService.canTransition('submitted', 'approved')).toBe(true);
    expect(purchaseOrderStateMachineService.canTransition('approved', 'received')).toBe(true);
    expect(purchaseOrderStateMachineService.canTransition('received', 'draft')).toBe(false);
  });

  it('should transition draft PO to submitted successfully', async () => {
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockPO);
    vi.spyOn(purchaseOrderRepository, 'update').mockResolvedValueOnce({
      ...mockPO,
      status: 'submitted',
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue({
      id: 'aud-1',
      organization_id: orgAId,
      user_id: userAId,
      action: 'UPDATE',
      entity_type: 'PURCHASE_ORDER',
      entity_id: poId,
      request_id: undefined,
      success: true,
      error_code: null,
      error_message: null,
      ip_address: null,
      user_agent: null,
      details: null,
      metadata: null,
      created_at: new Date(),
    });

    const result = await purchaseOrderStateMachineService.submitPurchaseOrder(
      orgAId,
      poId,
      userAId,
    );

    expect(result.status).toBe('submitted');
  });

  it('should reject invalid transition from draft directly to approved', async () => {
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockPO);

    await expect(
      purchaseOrderStateMachineService.approvePurchaseOrder(orgAId, poId, userAId),
    ).rejects.toThrow(InvalidPurchaseOrderStateTransitionError);
  });

  it('should reject transition if PO is already in target state', async () => {
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockPO);

    await expect(
      purchaseOrderStateMachineService.transitionPurchaseOrder(orgAId, poId, 'draft', userAId),
    ).rejects.toThrow(PurchaseOrderAlreadyInStateError);
  });

  it('should reject transition if PO is not found', async () => {
    vi.spyOn(purchaseOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(null);

    await expect(
      purchaseOrderStateMachineService.submitPurchaseOrder(orgAId, poId, userAId),
    ).rejects.toThrow(PurchaseOrderNotFoundError);
  });
});
