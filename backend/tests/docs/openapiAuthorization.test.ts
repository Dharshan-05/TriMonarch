import { describe, it, expect } from 'vitest';
import { openapiDocument } from '../../src/docs/openapi';

describe('Phase 076 — OpenAPI Authorization Audit', () => {
  it('secures protected routes using bearerAuth security requirement', () => {
    const usersPath = openapiDocument.paths['/api/v1/users'];
    expect(usersPath.get.security).toEqual([{ bearerAuth: [] }]);
  });
});
