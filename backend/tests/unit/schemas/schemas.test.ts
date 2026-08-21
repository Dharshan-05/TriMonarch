import { describe, it, expect } from 'vitest';
import {
  uuidSchema,
  paginationQuerySchema,
  dateRangeSchema,
  positiveDecimalSchema,
  emailSchema,
} from '../../../src/schemas/common.schema';
import { createProductSchema } from '../../../src/schemas/product.schema';
import { createPartnerSchema } from '../../../src/schemas/partner.schema';
import { mockProductId } from '../fixtures/mockData';

describe('Phase 061 — Zod Validation Schema Unit Tests', () => {
  describe('Common Schemas', () => {
    it('uuidSchema should validate valid UUIDs and reject invalid strings', () => {
      const valid = uuidSchema.safeParse(mockProductId);
      expect(valid.success).toBe(true);

      const invalid = uuidSchema.safeParse('not-a-uuid');
      expect(invalid.success).toBe(false);
    });

    it('emailSchema should validate valid emails and reject invalid emails', () => {
      const valid = emailSchema.safeParse('user@example.com');
      expect(valid.success).toBe(true);

      const invalid = emailSchema.safeParse('user-at-example.com');
      expect(invalid.success).toBe(false);
    });

    it('positiveDecimalSchema should validate positive numbers/decimals', () => {
      const validNum = positiveDecimalSchema.safeParse('99.99');
      expect(validNum.success).toBe(true);

      const invalidNegative = positiveDecimalSchema.safeParse('-10.00');
      expect(invalidNegative.success).toBe(false);
    });

    it('paginationQuerySchema should parse numeric page and pageSize parameters', () => {
      const result = paginationQuerySchema.safeParse({ page: '2', pageSize: '15' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(15);
      }
    });

    it('dateRangeSchema should validate when dateFrom is earlier than dateTo', () => {
      const validRange = dateRangeSchema.safeParse({
        dateFrom: '2026-01-01T00:00:00Z',
        dateTo: '2026-01-31T23:59:59Z',
      });
      expect(validRange.success).toBe(true);

      const invalidRange = dateRangeSchema.safeParse({
        dateFrom: '2026-02-01T00:00:00Z',
        dateTo: '2026-01-01T00:00:00Z',
      });
      expect(invalidRange.success).toBe(false);
    });
  });

  describe('Product Schemas', () => {
    it('createProductSchema should validate valid product creation payload', () => {
      const payload = {
        sku: 'SKU-UNIT-001',
        name: 'Test Product',
        price: '19.99',
        cost: '10.00',
        unit: 'pcs',
      };
      const result = createProductSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('createProductSchema should reject negative product price', () => {
      const payload = {
        sku: 'SKU-UNIT-002',
        name: 'Test Product',
        price: '-5.00',
      };
      const result = createProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Partner Schemas', () => {
    it('createPartnerSchema should validate customer / supplier partner objects', () => {
      const payload = {
        name: 'Acme Corp',
        type: 'customer',
        email: 'contact@acme.com',
      };
      const result = createPartnerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });
});
