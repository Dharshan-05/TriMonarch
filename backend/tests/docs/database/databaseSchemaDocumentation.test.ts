import { describe, it, expect } from 'vitest';
import { DOCUMENTED_TABLES, docFileContent } from './databaseDocumentationScanner';

describe('Phase 077 — Database Schema Documentation Audit', () => {
  it('schema.md documents all major ERP domain tables', () => {
    const content = docFileContent('schema.md');
    const missing = DOCUMENTED_TABLES.filter(t => !content.includes(t));
    expect(missing).toEqual([]);
  });
});
