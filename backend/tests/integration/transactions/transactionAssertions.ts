import { expect } from 'vitest';

export const assertStateUnchanged = <T>(beforeState: T, afterState: T): void => {
  expect(afterState).toEqual(beforeState);
};

export const assertNoOrphanRecords = <T>(records: T[]): void => {
  expect(records.length).toBe(0);
};
