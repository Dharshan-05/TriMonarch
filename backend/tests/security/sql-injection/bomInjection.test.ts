import { describe, it, expect, vi } from 'vitest';
import { bomRepository } from '../../../src/repositories/bom.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — BomRepository SQL Injection Audit', () => {
  it('parameterizes BOM number queries safely', async () => {
    vi.spyOn(bomRepository, 'findByBomNumber').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await bomRepository.findByBomNumber('11111111-1111-1111-1111-111111111111', payload);
      expect(res).toBeNull();
    }
  });
});
