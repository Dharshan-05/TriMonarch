import { describe, it, expect } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';

describe('Phase 076 — OpenAPI Pagination Schema Audit', () => {
  it('defines PaginationMeta schema with required fields', () => {
    const paginationSchema = openapiDocument.components.schemas.PaginationMeta;
    expect(paginationSchema.properties).toHaveProperty('page');
    expect(paginationSchema.properties).toHaveProperty('pageSize');
    expect(paginationSchema.properties).toHaveProperty('totalItems');
    expect(paginationSchema.properties).toHaveProperty('totalPages');
  });
});
