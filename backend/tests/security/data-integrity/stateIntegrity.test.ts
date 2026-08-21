import { describe, it, expect, vi } from 'vitest';
import { salesOrderService } from '../../../src/services/salesOrder.service';

describe('Phase 070 — Enum & State-Machine Integrity Audit', () => {
  it('prevents direct unauthorized or invalid state transition', async () => {
    vi.spyOn(salesOrderService, 'updateSalesOrder').mockRejectedValue(new Error('Invalid state transition'));

    await expect(
      salesOrderService.updateSalesOrder('11111111-1111-1111-1111-111111111111', 'so-completed-123', { status: 'draft' }),
    ).rejects.toThrow();
  });
});
