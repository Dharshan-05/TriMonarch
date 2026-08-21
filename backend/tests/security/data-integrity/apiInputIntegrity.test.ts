import { describe, it, expect, vi } from 'vitest';
import { validateRequest } from '../../../src/middleware/validation';

describe('Phase 070 — API Input Boundary Audit', () => {
  it('validates request schema at API boundary using Zod middleware', async () => {
    const req = { body: {} };
    const res = {};
    const next = vi.fn();

    const dummySchema = { parseAsync: vi.fn().mockRejectedValue(new Error('Validation error')) };
    const middleware = validateRequest({ body: dummySchema as never });

    await middleware(req as never, res as never, next);
    expect(next).toHaveBeenCalledWith(expect.anything());
  });
});
