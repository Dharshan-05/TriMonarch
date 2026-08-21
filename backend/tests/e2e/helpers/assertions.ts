import { expect } from 'vitest';

export const assertStandardSuccessResponse = (body: Record<string, unknown>): void => {
  expect(body.success).toBe(true);
  expect(body.data).toBeDefined();
  expect(body.meta).toBeDefined();
};

export const assertStandardErrorResponse = (body: Record<string, unknown>, expectedCode?: string): void => {
  expect(body.success).toBe(false);
  expect(body.error).toBeDefined();
  if (expectedCode) {
    const errorObj = body.error as { code?: string };
    expect(errorObj.code).toBe(expectedCode);
  }
};
