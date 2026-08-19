import { describe, it, expect } from 'vitest';
import {
  addDecimal,
  subtractDecimal,
  multiplyDecimal,
  divideDecimal,
  compareDecimal,
  roundDecimal,
  isValidDecimalString,
  DivisionByZeroError,
} from '../src/utils/decimal';
import { moneySchema } from '../src/schemas/decimal.schema';

describe('Decimal & Financial Precision Subsystem', () => {
  describe('Mandatory Floating-Point Precision Regression Test', () => {
    it('0.1 + 0.2 must NOT produce floating-point artifact 0.30000000000000004', () => {
      const sum = addDecimal('0.1', '0.2', 4);
      expect(sum).toBe('0.3000');
      expect(sum).not.toBe('0.30000000000000004');
    });
  });

  describe('Exact Financial Arithmetic', () => {
    it('should perform addition, subtraction, multiplication, and division accurately', () => {
      expect(addDecimal('10.10', '20.20', 4)).toBe('30.3000');
      expect(subtractDecimal('100.00', '25.50', 4)).toBe('74.5000');
      expect(multiplyDecimal('19.99', '2', 4)).toBe('39.9800');
      expect(divideDecimal('100', '4', 4)).toBe('25.0000');
    });

    it('should throw DivisionByZeroError when dividing by zero', () => {
      expect(() => divideDecimal('100', '0')).toThrow(DivisionByZeroError);
    });

    it('should handle large arbitrary-precision values without overflow or truncation', () => {
      const result = addDecimal('999999999999.9999', '0.0001', 4);
      expect(result).toBe('1000000000000.0000');
    });
  });

  describe('Financial Rounding (HALF_UP)', () => {
    it('should round correctly around .005 boundaries using HALF_UP mode', () => {
      expect(roundDecimal('1.0049', 2)).toBe('1.00');
      expect(roundDecimal('1.0050', 2)).toBe('1.01');
      expect(roundDecimal('1.0051', 2)).toBe('1.01');
    });
  });

  describe('Decimal Numeric Comparison', () => {
    it('should evaluate numeric comparisons safely ignoring trailing scale differences', () => {
      expect(compareDecimal('10.00', '10')).toBe(0);
      expect(compareDecimal('10.01', '10.00')).toBeGreaterThan(0);
      expect(compareDecimal('9.99', '10.00')).toBeLessThan(0);
      expect(compareDecimal('0.0', '0.0000')).toBe(0);
    });
  });

  describe('Input Validation & Zod Schema Enforcement', () => {
    it('should validate valid decimal strings and reject malformed/unsafe strings', () => {
      expect(isValidDecimalString('10')).toBe(true);
      expect(isValidDecimalString('10.50')).toBe(true);
      expect(isValidDecimalString('-5.25')).toBe(true);

      expect(isValidDecimalString('abc')).toBe(false);
      expect(isValidDecimalString('1.2.3')).toBe(false);
      expect(isValidDecimalString('NaN')).toBe(false);
      expect(isValidDecimalString('Infinity')).toBe(false);
      expect(isValidDecimalString('')).toBe(false);
    });

    it('should validate and transform money strings via Zod schema', () => {
      const schema = moneySchema;

      expect(schema.parse('19.99')).toBe('19.9900');
      expect(schema.parse(10.5)).toBe('10.5000');

      expect(() => schema.parse('-10.00')).toThrow();
      expect(() => schema.parse('invalid')).toThrow();
    });
  });
});
