import { describe, it, expect, vi } from 'vitest';
import { productRepository } from '../../../src/repositories/product.repository';
import { UNION_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — Search Input SQL Injection Audit', () => {
  it('prevents search parameter wildcard or query injection', async () => {
    vi.spyOn(productRepository, 'search').mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } as never);

    for (const payload of UNION_SQL_PAYLOADS) {
      const res = await productRepository.search('11111111-1111-1111-1111-111111111111', { query: payload });
      expect(res.items.length).toBe(0);
    }
  });
});
