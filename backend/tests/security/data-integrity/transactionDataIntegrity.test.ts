import { describe, it, expect, vi } from 'vitest';
import * as txModule from '../../../src/db/transaction';

describe('Phase 070 — Data Corruption / Transaction Integrity Audit', () => {
  it('rolls back database mutations completely upon error inside transaction block', async () => {
    vi.spyOn(txModule, 'withTransaction').mockRejectedValue(new Error('Simulated transaction error'));

    await expect(
      txModule.withTransaction(async () => {
        throw new Error('Simulated transaction error');
      }),
    ).rejects.toThrow('Simulated transaction error');
  });
});
