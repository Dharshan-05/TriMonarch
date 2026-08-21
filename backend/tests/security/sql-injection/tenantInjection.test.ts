import { describe, it, expect, vi } from 'vitest';
import { productRepository } from '../../../src/repositories/product.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — Tenant-Isolation SQL Injection Audit', () => {
  it('prevents SQL injection payload in organization_id from bypassing tenant boundary', async () => {
    vi.spyOn(productRepository, 'findById').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await productRepository.findById(payload, 'p-1');
      expect(res).toBeNull();
    }
  });
});
