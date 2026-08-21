import { describe, it, expect } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';

describe('Phase 076 — OpenAPI Security Schemes Audit', () => {
  it('defines bearerAuth HTTP Bearer JWT security scheme', () => {
    const securitySchemes = openapiDocument.components.securitySchemes;
    expect(securitySchemes).toHaveProperty('bearerAuth');
    expect(securitySchemes.bearerAuth.type).toBe('http');
    expect(securitySchemes.bearerAuth.scheme).toBe('bearer');
    expect(securitySchemes.bearerAuth.bearerFormat).toBe('JWT');
  });
});
