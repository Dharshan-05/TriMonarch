import { describe, it, expect } from 'vitest';
import { SECRET_PATTERNS, allArchContent } from './architectureDocumentationScanner';

describe('Phase 078 — Architecture Security Documentation Audit', () => {
  it('no real credentials or secrets appear in architecture docs', () => {
    const content = allArchContent();
    const found = SECRET_PATTERNS.filter(p => content.includes(p));
    expect(found).toEqual([]);
  });

  it('security.md documents SQL injection prevention and authentication security', () => {
    const content = allArchContent();
    expect(content.toLowerCase()).toContain('sql injection');
    expect(content.toLowerCase()).toContain('authentication');
  });
});
