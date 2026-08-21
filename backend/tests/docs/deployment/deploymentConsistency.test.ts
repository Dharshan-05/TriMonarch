import { describe, it, expect } from 'vitest';
import { REQUIRED_SECTIONS, deploymentFileContent } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Documentation Consistency Audit', () => {
  it('each deployment document contains its required key sections', () => {
    const failures: string[] = [];
    for (const [file, keywords] of Object.entries(REQUIRED_SECTIONS)) {
      const content = deploymentFileContent(file).toLowerCase();
      for (const kw of keywords) {
        if (!content.includes(kw)) {
          failures.push(`${file} missing keyword: "${kw}"`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
