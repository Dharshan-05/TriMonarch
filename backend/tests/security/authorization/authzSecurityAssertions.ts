import { expect } from 'vitest';
import { AuthorizationDecision } from '../../../src/types/policy';

export const assertDeniedDecision = (decision: AuthorizationDecision): void => {
  expect(decision.allowed).toBe(false);
  expect(decision.reason).toBeDefined();
};
