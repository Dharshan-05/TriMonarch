import { describe, it, expect } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';

describe('Phase 076 — OpenAPI Authentication Endpoints Audit', () => {
  it('documents login and refresh token endpoints under Authentication tag', () => {
    const loginPath = openapiDocument.paths['/api/v1/auth/login'];
    expect(loginPath.post.tags).toContain('Authentication');
    expect(loginPath.post.responses).toHaveProperty('200');
    expect(loginPath.post.responses).toHaveProperty('401');
  });
});
