import { expect } from 'vitest';

export const assertNoErrorDisclosure = (error: unknown): void => {
  const msg = error instanceof Error ? error.message : String(error);
  expect(msg).not.toContain('syntax error at or near');
  expect(msg).not.toContain('relation "users" does not exist');
};
