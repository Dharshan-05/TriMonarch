import { describe, it, expect } from 'vitest';
import { REQUIRED_SECTIONS, archFileContent } from './architectureDocumentationScanner';

describe('Phase 078 — Architecture Documentation Consistency Audit', () => {
  it('each architecture document contains its required key sections', () => {
    const failures: string[] = [];
    for (const [file, keywords] of Object.entries(REQUIRED_SECTIONS)) {
      const content = archFileContent(file).toLowerCase();
      for (const kw of keywords) {
        if (!content.includes(kw)) {
          failures.push(`${file} missing keyword: "${kw}"`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
