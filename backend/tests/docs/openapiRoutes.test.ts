import { describe, it, expect } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';

describe('Phase 076 — OpenAPI Path Definitions Audit', () => {
  it('defines operational endpoints and core ERP API paths', () => {
    const paths = openapiDocument.paths;
    expect(paths).toHaveProperty('/health');
    expect(paths).toHaveProperty('/health/live');
    expect(paths).toHaveProperty('/health/ready');
    expect(paths).toHaveProperty('/metrics');
    expect(paths).toHaveProperty('/api/v1/auth/login');
    expect(paths).toHaveProperty('/api/v1/users');
    expect(paths).toHaveProperty('/api/v1/products');
  });
});
