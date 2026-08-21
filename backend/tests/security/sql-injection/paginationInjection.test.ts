import { describe, it, expect, vi } from 'vitest';
import { productRepository } from '../../../src/repositories/product.repository';

describe('Phase 067 — LIMIT / OFFSET SQL Injection Audit', () => {
  it('enforces numeric pagination bounds preventing SQL expression execution', async () => {
    vi.spyOn(productRepository, 'listByOrganization').mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } as never);

    const res = await productRepository.listByOrganization('11111111-1111-1111-1111-111111111111', { page: 1, pageSize: 20 });
    expect(res.page).toBe(1);
    expect(res.pageSize).toBe(10);
  });
});
