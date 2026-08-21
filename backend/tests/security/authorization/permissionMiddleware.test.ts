import { describe, it, expect, vi } from 'vitest';
import { requirePermission } from '../../../src/middleware/rbac';

describe('Phase 069 — Permission Middleware Audit', () => {
  it('rejects unauthenticated request attempting permission-protected route', async () => {
    const req = { auth: undefined };
    const res = {};
    const next = vi.fn();

    const middleware = requirePermission('product:read' as never);
    await middleware(req as never, res as never, next);
    expect(next).toHaveBeenCalledWith(expect.anything());
  });
});
