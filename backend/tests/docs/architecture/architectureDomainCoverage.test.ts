import { describe, it, expect } from 'vitest';
import { REQUIRED_DOMAINS, allArchContent } from './architectureDocumentationScanner';

describe('Phase 078 — Architecture Domain Coverage Audit', () => {
  it('domains.md covers all ERP domain areas', () => {
    const content = allArchContent();
    const missing = REQUIRED_DOMAINS.filter(d => !content.toLowerCase().includes(d));
    expect(missing).toEqual([]);
  });
});
