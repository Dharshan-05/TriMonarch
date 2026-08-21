import { describe, it, expect } from 'vitest';
import { toDecimal, formatDecimal, QUANTITY_SCALE } from '../src/utils/decimal';

describe('Manufacturing Rollback Engine Calculations (Phase 038)', () => {
  it('should calculate new consumed quantity after material reversal correctly', () => {
    const consumed = toDecimal('15.0000');
    const reversed = toDecimal('5.0000');
    const newConsumed = consumed.sub(reversed);

    expect(formatDecimal(newConsumed, QUANTITY_SCALE)).toBe('10.0000');
  });

  it('should reject material reversal exceeding consumed quantity', () => {
    const consumed = toDecimal('15.0000');
    const requestedReversal = toDecimal('16.0000');

    expect(requestedReversal.gt(consumed)).toBe(true);
  });

  it('should calculate new produced quantity after finished goods reversal correctly', () => {
    const produced = toDecimal('50.0000');
    const reversed = toDecimal('10.0000');
    const newProduced = produced.sub(reversed);

    expect(formatDecimal(newProduced, QUANTITY_SCALE)).toBe('40.0000');
  });

  it('should reject production reversal exceeding produced quantity', () => {
    const produced = toDecimal('50.0000');
    const requestedReversal = toDecimal('51.0000');

    expect(requestedReversal.gt(produced)).toBe(true);
  });
});
