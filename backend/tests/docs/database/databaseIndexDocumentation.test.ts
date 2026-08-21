import { describe, it, expect } from 'vitest';
import { docFileContent } from './databaseDocumentationScanner';

describe('Phase 077 — Database Index Documentation Audit', () => {
  it('indexes.md documents tenant-scoped indexes and query patterns', () => {
    const content = docFileContent('indexes.md');
    expect(content).toContain('organization_id');
    expect(content.toLowerCase()).toContain('index');
  });
});
