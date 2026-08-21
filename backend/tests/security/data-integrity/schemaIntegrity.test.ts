import { describe, it, expect } from 'vitest';
import { createProductSchema } from '../../../src/schemas/product.schema';
import { MALFORMED_UUID_PAYLOADS } from './integrityPayloads';

describe('Phase 070 — Schema Validation Audit', () => {
  it('rejects malformed UUIDs and negative prices in product schema', () => {
    const invalidInput = {
      sku: 'SKU-ERR',
      name: 'Bad Product',
      price: -10,
    };

    const res = createProductSchema.safeParse(invalidInput);
    expect(res.success).toBe(false);
  });

  it('rejects malformed UUID fields', () => {
    for (const uuid of MALFORMED_UUID_PAYLOADS) {
      const res = createProductSchema.safeParse({ sku: 'SKU', name: 'N', organization_id: uuid });
      expect(res.success).toBe(false);
    }
  });
});
