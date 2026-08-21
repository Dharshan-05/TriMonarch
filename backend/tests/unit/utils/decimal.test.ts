import { describe, it, expect } from 'vitest';
import {
  addDecimal,
  subtractDecimal,
  multiplyDecimal,
  divideDecimal,
  roundDecimal,
} from '../../../src/utils/decimal';

describe('Phase 061 — Financial Decimal Utility Unit Tests', () => {
  it('addDecimal should perform exact decimal addition without floating point inaccuracy', () => {
    const result = addDecimal('0.1', '0.2');
    expect(result).toBe('0.3');
  });

  it('subtractDecimal should perform exact decimal subtraction', () => {
    const result = subtractDecimal('10.50', '2.25');
    expect(result).toBe('8.25');
  });

  it('multiplyDecimal should calculate exact tax and discount totals', () => {
    const tax = multiplyDecimal('100.00', '0.05'); // 5% tax on 100.00
    expect(tax).toBe('5');
  });

  it('divideDecimal should perform precise division', () => {
    const result = divideDecimal('100.00', '4');
    expect(result).toBe('25.0000');
  });

  it('roundDecimal should round values to specified scale', () => {
    const result = roundDecimal('123.45678', 2);
    expect(result).toBe('123.46');
  });

  it('should handle large and high-precision numbers correctly', () => {
    const largeAdd = addDecimal('999999999.9999', '0.0001');
    expect(largeAdd).toBe('1000000000');
  });
});
