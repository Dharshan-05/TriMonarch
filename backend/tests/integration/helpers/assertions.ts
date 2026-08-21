import { expect } from 'vitest';

export const expectTenantIsolated = <T extends { organization_id?: string }>(
  records: T[],
  expectedOrgId: string,
): void => {
  expect(records).toBeDefined();
  for (const record of records) {
    if (record.organization_id) {
      expect(record.organization_id).toBe(expectedOrgId);
    }
  }
};
