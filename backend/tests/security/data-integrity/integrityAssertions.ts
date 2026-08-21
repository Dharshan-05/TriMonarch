import { expect } from 'vitest';

export const assertNonNegativeBalance = (balance: number): void => {
  expect(balance).toBeGreaterThanOrEqual(0);
};
