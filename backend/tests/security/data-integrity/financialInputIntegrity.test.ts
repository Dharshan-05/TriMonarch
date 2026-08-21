import { describe, it, expect } from 'vitest';
import { validatePositiveNumber } from './integrityHelpers';
import { MALFORMED_NUMERIC_PAYLOADS } from './integrityPayloads';

describe('Phase 070 — Numeric & Financial Integrity Audit', () => {
  it('rejects invalid or non-finite numbers for financial values', () => {
    for (const val of MALFORMED_NUMERIC_PAYLOADS) {
      if (typeof val === 'number') {
        expect(validatePositiveNumber(val)).toBe(false);
      }
    }
  });
});
