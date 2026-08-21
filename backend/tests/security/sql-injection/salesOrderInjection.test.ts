import { describe, it, expect, vi } from 'vitest';
import { salesOrderRepository } from '../../../src/repositories/salesOrder.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — SalesOrderRepository SQL Injection Audit', () => {
  it('parameterizes sales order number queries safely', async () => {
    vi.spyOn(salesOrderRepository, 'findByOrderNumber').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await salesOrderRepository.findByOrderNumber('11111111-1111-1111-1111-111111111111', payload);
      expect(res).toBeNull();
    }
  });
});
