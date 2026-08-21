import { describe, it, expect } from 'vitest';
import { CREDENTIAL_PATTERNS, allDocContent } from './databaseDocumentationScanner';

describe('Phase 077 — Database Security Documentation Audit', () => {
  it('no real credentials, connection strings, or secrets appear in database docs', () => {
    const content = allDocContent();
    const found = CREDENTIAL_PATTERNS.filter(p => content.includes(p));
    expect(found).toEqual([]);
  });

  it('security.md documents database credential and network security practices', () => {
    const content = allDocContent();
    expect(content.toLowerCase()).toContain('environment variable');
  });
});
