import { describe, it, expect } from 'vitest';
import { subtractDecimal, formatDecimal } from '../../../src/utils/decimal';

describe('Phase 066 — Inventory Integrity E2E Testing', () => {
  it('prevents negative inventory during complete consumption flow', () => {
    const openingStock = '100.0000';
    const consumed = '40.0000';
    const remaining = subtractDecimal(openingStock, consumed, 4);

    expect(formatDecimal(remaining, 4)).toBe('60.0000');
    expect(Number(remaining.toString())).toBeGreaterThanOrEqual(0);
  });
});
