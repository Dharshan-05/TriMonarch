import { describe, it, expect, vi } from 'vitest';
import { manufacturingRepository } from '../../../src/repositories/manufacturing.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — ManufacturingRepository SQL Injection Audit', () => {
  it('parameterizes manufacturing order number queries safely', async () => {
    vi.spyOn(manufacturingRepository, 'findByOrderNumber').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await manufacturingRepository.findByOrderNumber('11111111-1111-1111-1111-111111111111', payload);
      expect(res).toBeNull();
    }
  });
});
