import { expect } from 'vitest';

export const assertNonNegativeStock = (quantityStr: string): void => {
  const qty = parseFloat(quantityStr);
  expect(qty).toBeGreaterThanOrEqual(0);
};

export const assertExactlyOneSuccess = <T>(results: PromiseSettledResult<T>[]): void => {
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');
  expect(fulfilled.length).toBe(1);
  expect(rejected.length).toBe(results.length - 1);
};
