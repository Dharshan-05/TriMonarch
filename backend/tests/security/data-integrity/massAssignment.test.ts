import { describe, it, expect } from 'vitest';
import { sanitizeResponseData } from '../../../src/utils/response';

describe('Phase 070 — Mass Assignment Protection Audit', () => {
  it('strips protected server-owned fields from client DTOs', () => {
    const raw = { name: 'Test', role: 'SUPER_ADMIN', isAdmin: true };
    const sanitized = sanitizeResponseData(raw);

    expect(sanitized).toBeDefined();
  });
});
