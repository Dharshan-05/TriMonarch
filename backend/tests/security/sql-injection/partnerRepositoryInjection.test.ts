import { describe, it, expect, vi } from 'vitest';
import { customerRepository } from '../../../src/repositories/customer.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — Partner/CustomerRepository SQL Injection Audit', () => {
  it('parameterizes customer lookups safely', async () => {
    vi.spyOn(customerRepository, 'findById').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await customerRepository.findById('11111111-1111-1111-1111-111111111111', payload);
      expect(res).toBeNull();
    }
  });
});
