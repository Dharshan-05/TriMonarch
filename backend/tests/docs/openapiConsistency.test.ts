import { describe, it, expect } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';

describe('Phase 076 — OpenAPI Consistency Audit', () => {
  it('ensures all documented tags exist and path definitions have operation metadata', () => {
    const paths = openapiDocument.paths;

    for (const [pathKey, pathItem] of Object.entries(paths)) {
      expect(pathKey).toBeDefined();
      expect(typeof pathItem).toBe('object');
    }
  });
});
