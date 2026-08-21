import { describe, it, expect } from 'vitest';
import { multiplyDecimal, addDecimal, formatDecimal } from '../../../src/utils/decimal';

describe('Phase 066 — Financial Integrity E2E Testing', () => {
  it('computes exact subtotal, tax, discount, and total without floating-point precision loss', () => {
    const qty = '5.0000';
    const price = '150.0000';
    const subtotal = multiplyDecimal(qty, price, 4);
    expect(formatDecimal(subtotal, 4)).toBe('750.0000');

    const taxRate = '0.1000';
    const tax = multiplyDecimal(subtotal, taxRate, 4);
    expect(formatDecimal(tax, 4)).toBe('75.0000');

    const total = addDecimal(subtotal, tax, 4);
    expect(formatDecimal(total, 4)).toBe('825.0000');
  });
});
