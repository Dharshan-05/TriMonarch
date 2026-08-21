import { describe, it, expect } from 'vitest';
import { toDecimal, formatDecimal, QUANTITY_SCALE } from '../src/utils/decimal';
import Decimal from 'decimal.js';

describe('Manufacturing Material Consumption Engine Calculations (Phase 036)', () => {
  it('should calculate remaining quantity correctly', () => {
    const required = toDecimal('100.0000');
    const consumed = toDecimal('30.0000');
    const remaining = Decimal.max(0, required.sub(consumed));

    expect(formatDecimal(remaining, QUANTITY_SCALE)).toBe('70.0000');
  });

  it('should allow valid partial consumption', () => {
    const required = toDecimal('100.0000');
    const consumed = toDecimal('30.0000');
    const remaining = Decimal.max(0, required.sub(consumed));
    const requested = toDecimal('50.0000');

    expect(requested.lte(remaining)).toBe(true);
  });

  it('should reject over-consumption when requested > remaining', () => {
    const required = toDecimal('100.0000');
    const consumed = toDecimal('30.0000');
    const remaining = Decimal.max(0, required.sub(consumed));
    const requested = toDecimal('71.0000');

    expect(requested.gt(remaining)).toBe(true);
  });

  it('should detect exact full consumption', () => {
    const required = toDecimal('100.0000');
    const consumed = toDecimal('100.0000');

    expect(consumed.gte(required)).toBe(true);
  });
});
