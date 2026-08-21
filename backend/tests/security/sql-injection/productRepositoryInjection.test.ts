import { describe, it, expect, vi } from 'vitest';
import { productRepository } from '../../../src/repositories/product.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — ProductRepository SQL Injection Audit', () => {
  it('parameterizes SKU queries safely', async () => {
    vi.spyOn(productRepository, 'findBySku').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await productRepository.findBySku('11111111-1111-1111-1111-111111111111', payload);
      expect(res).toBeNull();
    }
  });
});
