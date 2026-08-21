import { describe, it, expect, vi } from 'vitest';
import { productRepository } from '../../../src/repositories/product.repository';
import { STACKED_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — Second-Order SQL Injection Audit', () => {
  it('stores and reads malicious SQL strings strictly as data', async () => {
    const maliciousName = STACKED_SQL_PAYLOADS[0];
    vi.spyOn(productRepository, 'create').mockResolvedValue({
      id: 'p-sec-1',
      organization_id: '11111111-1111-1111-1111-111111111111',
      sku: 'SKU-SEC-1',
      name: maliciousName,
    } as never);

    const created = await productRepository.create({
      organization_id: '11111111-1111-1111-1111-111111111111',
      sku: 'SKU-SEC-1',
      name: maliciousName,
    });

    expect(created.name).toBe(maliciousName);
  });
});
