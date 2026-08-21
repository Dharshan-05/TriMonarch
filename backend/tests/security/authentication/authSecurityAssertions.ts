import { expect } from 'vitest';

export const assertNoCredentialLeakage = (obj: Record<string, unknown>): void => {
  const str = JSON.stringify(obj).toLowerCase();
  expect(str).not.toContain('passwordhash');
  expect(str).not.toContain('databasepassword');
};
