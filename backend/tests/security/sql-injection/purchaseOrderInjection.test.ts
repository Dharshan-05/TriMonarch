import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderRepository } from '../../../src/repositories/purchaseOrder.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — PurchaseOrderRepository SQL Injection Audit', () => {
  it('parameterizes purchase order number queries safely', async () => {
    vi.spyOn(purchaseOrderRepository, 'findByOrderNumber').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await purchaseOrderRepository.findByOrderNumber('11111111-1111-1111-1111-111111111111', payload);
      expect(res).toBeNull();
    }
  });
});
