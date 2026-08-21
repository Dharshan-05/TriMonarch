import { expect, vi } from 'vitest';
import * as txModule from '../../../src/db/transaction';

export const expectTransactionRollback = async <T>(
  operation: () => Promise<T>,
  expectedErrorClass?: new (...args: unknown[]) => Error,
): Promise<void> => {
  let failed = false;
  try {
    await operation();
  } catch (error) {
    failed = true;
    if (expectedErrorClass) {
      expect(error).toBeInstanceOf(expectedErrorClass);
    }
  }
  expect(failed).toBe(true);
};

export const runWithRollbackSimulation = async <T>(
  action: () => Promise<T>,
): Promise<void> => {
  vi.spyOn(txModule, 'withTransaction').mockImplementationOnce(async (cb) => {
    await cb({} as never);
    throw new Error('FORCED_SIMULATED_TRANSACTION_ROLLBACK');
  });

  try {
    await txModule.withTransaction(async () => {
      await action();
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    expect(msg).toBe('FORCED_SIMULATED_TRANSACTION_ROLLBACK');
  }
};
