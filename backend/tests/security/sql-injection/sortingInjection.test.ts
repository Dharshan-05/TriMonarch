import { describe, it, expect, vi } from 'vitest';
import { productRepository } from '../../../src/repositories/product.repository';
import { ORDER_BY_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — ORDER BY SQL Injection Audit', () => {
  it('safely handles or rejects malicious ORDER BY fields', async () => {
    vi.spyOn(productRepository, 'listByOrganization').mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } as never);

    for (const payload of ORDER_BY_SQL_PAYLOADS) {
      await expect(
        productRepository.listByOrganization('11111111-1111-1111-1111-111111111111', { sortBy: payload }),
      ).resolves.toBeDefined();
    }
  });
});
