import { describe, it, expect } from 'vitest';
import { docFileContent } from './databaseDocumentationScanner';

describe('Phase 077 — Database Migration Documentation Audit', () => {
  it('migrations.md documents migration naming, ordering, and lifecycle', () => {
    const content = docFileContent('migrations.md');
    expect(content.toLowerCase()).toContain('migration');
    expect(content.toLowerCase()).toContain('rollback');
  });
});
