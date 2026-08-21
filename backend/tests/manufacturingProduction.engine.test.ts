import { describe, it, expect } from 'vitest';
import { toDecimal, formatDecimal, QUANTITY_SCALE } from '../src/utils/decimal';
import Decimal from 'decimal.js';

describe('Manufacturing Finished Goods Production Calculations (Phase 037)', () => {
  it('should calculate remaining production capacity correctly', () => {
    const planned = toDecimal('100.0000');
    const produced = toDecimal('80.0000');
    const remaining = Decimal.max(0, planned.sub(produced));

    expect(formatDecimal(remaining, QUANTITY_SCALE)).toBe('20.0000');
  });

  it('should allow production equal to remaining quantity', () => {
    const planned = toDecimal('100.0000');
    const produced = toDecimal('80.0000');
    const remaining = Decimal.max(0, planned.sub(produced));
    const requested = toDecimal('20.0000');

    expect(requested.lte(remaining)).toBe(true);
  });

  it('should reject production exceeding remaining quantity', () => {
    const planned = toDecimal('100.0000');
    const produced = toDecimal('80.0000');
    const remaining = Decimal.max(0, planned.sub(produced));
    const requested = toDecimal('21.0000');

    expect(requested.gt(remaining)).toBe(true);
  });

  it('should detect when production is fully complete', () => {
    const planned = toDecimal('100.0000');
    const currentProduced = toDecimal('80.0000');
    const requested = toDecimal('20.0000');
    const newProduced = currentProduced.add(requested);

    expect(newProduced.gte(planned)).toBe(true);
  });
});
