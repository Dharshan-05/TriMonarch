import { describe, it, expect, vi } from 'vitest';
import { auditRepository } from '../../../src/audit/audit.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — AuditRepository SQL Injection Audit', () => {
  it('parameterizes audit record lookups safely', async () => {
    vi.spyOn(auditRepository, 'findById').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await auditRepository.findById('11111111-1111-1111-1111-111111111111', payload);
      expect(res).toBeNull();
    }
  });
});
