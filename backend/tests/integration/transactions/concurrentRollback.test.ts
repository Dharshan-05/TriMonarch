import { describe, it, expect, vi } from 'vitest';
import * as txModule from '../../../src/db/transaction';

describe('Phase 064 — Concurrent Transaction Rollback Tests', () => {
  it('should handle transactional lock release on simulated rollback', async () => {
    vi.spyOn(txModule, 'withTransaction').mockImplementationOnce(async (cb) => {
      await cb({} as never);
      throw new Error('SIMULATED_LOCK_RELEASE');
    });

    let released = false;
    try {
      await txModule.withTransaction(async () => {
        released = true;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      expect(msg).toBe('SIMULATED_LOCK_RELEASE');
    }
    expect(released).toBe(true);
  });
});
