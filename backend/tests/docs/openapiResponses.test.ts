import { describe, it, expect } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';

describe('Phase 076 — OpenAPI Response Contract Schemas Audit', () => {
  it('defines ApiMeta and ApiErrorResponse reusable schemas', () => {
    const schemas = openapiDocument.components.schemas;
    expect(schemas).toHaveProperty('ApiMeta');
    expect(schemas).toHaveProperty('ApiErrorResponse');
    expect(schemas).toHaveProperty('PaginationMeta');
  });
});
