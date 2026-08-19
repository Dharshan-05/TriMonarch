import Decimal from 'decimal.js';
import { AppError } from '../types';

export class InvalidDecimalError extends AppError {
  constructor(message = 'Invalid decimal numeric format', code = 'INVALID_DECIMAL') {
    super(message, 400, code);
  }
}

export class DivisionByZeroError extends AppError {
  constructor(message = 'Division by zero is not permitted', code = 'DIVISION_BY_ZERO') {
    super(message, 400, code);
  }
}

export class DecimalOverflowError extends AppError {
  constructor(message = 'Decimal value exceeds maximum allowable precision', code = 'DECIMAL_OVERFLOW') {
    super(message, 400, code);
  }
}

export const MONEY_SCALE = 4;
export const QUANTITY_SCALE = 4;
export const RATE_SCALE = 6;

// Configure Decimal.js default precision and rounding mode (ROUND_HALF_UP = 4)
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type DecimalInput = string | number | Decimal;

export const isValidDecimalString = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  try {
    const d = new Decimal(trimmed);
    return !d.isNaN() && d.isFinite();
  } catch {
    return false;
  }
};

export const toDecimal = (value: DecimalInput): Decimal => {
  if (value instanceof Decimal) {
    if (value.isNaN() || !value.isFinite()) {
      throw new InvalidDecimalError();
    }
    return value;
  }

  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      throw new InvalidDecimalError('Numeric value must be a finite number');
    }
  }

  try {
    const d = new Decimal(value);
    if (d.isNaN() || !d.isFinite()) {
      throw new InvalidDecimalError();
    }
    return d;
  } catch (error) {
    if (error instanceof InvalidDecimalError) throw error;
    throw new InvalidDecimalError(`Invalid decimal value: ${String(value)}`);
  }
};

export const formatDecimal = (value: DecimalInput, scale = MONEY_SCALE): string => {
  const d = toDecimal(value);
  return d.toFixed(scale);
};

export const addDecimal = (a: DecimalInput, b: DecimalInput, scale?: number): string => {
  const da = toDecimal(a);
  const db = toDecimal(b);
  const res = da.plus(db);
  return scale !== undefined ? res.toFixed(scale) : res.toString();
};

export const subtractDecimal = (a: DecimalInput, b: DecimalInput, scale?: number): string => {
  const da = toDecimal(a);
  const db = toDecimal(b);
  const res = da.minus(db);
  return scale !== undefined ? res.toFixed(scale) : res.toString();
};

export const multiplyDecimal = (a: DecimalInput, b: DecimalInput, scale?: number): string => {
  const da = toDecimal(a);
  const db = toDecimal(b);
  const res = da.times(db);
  return scale !== undefined ? res.toFixed(scale) : res.toString();
};

export const divideDecimal = (a: DecimalInput, b: DecimalInput, scale = MONEY_SCALE): string => {
  const da = toDecimal(a);
  const db = toDecimal(b);
  if (db.isZero()) {
    throw new DivisionByZeroError();
  }
  const res = da.dividedBy(db);
  return res.toFixed(scale);
};

export const compareDecimal = (a: DecimalInput, b: DecimalInput): number => {
  const da = toDecimal(a);
  const db = toDecimal(b);
  return da.comparedTo(db);
};

export const roundDecimal = (
  value: DecimalInput,
  scale = MONEY_SCALE,
  mode: Decimal.Rounding = Decimal.ROUND_HALF_UP,
): string => {
  const d = toDecimal(value);
  return d.toDecimalPlaces(scale, mode).toFixed(scale);
};
