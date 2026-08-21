import { describe, it, expect } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';

describe('Phase 076 — OpenAPI Schema Audit', () => {
  it('validates basic OpenAPI 3.1 structure and info metadata', () => {
    expect(openapiDocument.openapi).toBe('3.1.0');
    expect(openapiDocument.info.title).toBe('TriMonarch ERP API');
    expect(openapiDocument.info.version).toBe('1.0.0');
  });
});
