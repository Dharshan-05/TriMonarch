import { describe, it, expect } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';

describe('Phase 076 — OpenAPI Secret Leakage Security Audit', () => {
  it('does not leak real JWT secrets, database credentials, or private tokens in specification', () => {
    const specStr = JSON.stringify(openapiDocument);
    expect(specStr).not.toContain('postgres://');
    expect(specStr).not.toContain('CHANGE_ME');
    expect(specStr).not.toContain('development-super-secret-key-32-chars-long');
  });
});
