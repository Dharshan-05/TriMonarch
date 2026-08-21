import { describe, it, expect } from 'vitest';
import { REQUIRED_DOC_FILES, docFileExists, DOCS_DATABASE_DIR } from './databaseDocumentationScanner';
import * as fs from 'fs';

describe('Phase 077 — Database Documentation Coverage Audit', () => {
  it('documentation directory exists', () => {
    expect(fs.existsSync(DOCS_DATABASE_DIR)).toBe(true);
  });

  it('all required database documentation files exist', () => {
    const missing = REQUIRED_DOC_FILES.filter(f => !docFileExists(f));
    expect(missing).toEqual([]);
  });
});
