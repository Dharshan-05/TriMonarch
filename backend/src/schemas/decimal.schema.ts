import { z } from 'zod';
import { isValidDecimalString, toDecimal, compareDecimal } from '../utils/decimal';

export interface DecimalSchemaOptions {
  min?: number | string;
  max?: number | string;
  allowNegative?: boolean;
  scale?: number;
}

export const decimalStringSchema = (options?: DecimalSchemaOptions) => {
  return z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .refine((val) => isValidDecimalString(val), {
      message: 'Invalid decimal string format',
    })
    .refine(
      (val) => {
        if (options?.allowNegative === false) {
          return compareDecimal(val, 0) >= 0;
        }
        return true;
      },
      { message: 'Negative decimal values are not permitted for this field' },
    )
    .refine(
      (val) => {
        if (options?.min !== undefined) {
          return compareDecimal(val, options.min) >= 0;
        }
        return true;
      },
      (val) => ({ message: `Decimal value ${val} must be greater than or equal to ${options?.min}` }),
    )
    .refine(
      (val) => {
        if (options?.max !== undefined) {
          return compareDecimal(val, options.max) <= 0;
        }
        return true;
      },
      (val) => ({ message: `Decimal value ${val} must be less than or equal to ${options?.max}` }),
    )
    .transform((val) => {
      const d = toDecimal(val);
      return options?.scale !== undefined ? d.toFixed(options.scale) : d.toString();
    });
};

export const moneySchema = decimalStringSchema({ min: 0, allowNegative: false, scale: 4 });
export const quantitySchema = decimalStringSchema({ scale: 4 });
export const rateSchema = decimalStringSchema({ min: 0, max: 100, allowNegative: false, scale: 6 });
