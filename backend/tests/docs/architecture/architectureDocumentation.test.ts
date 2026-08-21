import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { DOCS_ARCH_DIR, REQUIRED_ARCH_FILES, archFileExists } from './architectureDocumentationScanner';

describe('Phase 078 — Architecture Documentation Structure Audit', () => {
  it('architecture documentation directory exists', () => {
    expect(fs.existsSync(DOCS_ARCH_DIR)).toBe(true);
  });

  it('all required architecture documentation files exist', () => {
    const missing = REQUIRED_ARCH_FILES.filter(f => !archFileExists(f));
    expect(missing).toEqual([]);
  });
});
