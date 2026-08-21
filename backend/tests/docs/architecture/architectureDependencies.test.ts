import { describe, it, expect } from 'vitest';
import { allArchContent } from './architectureDocumentationScanner';

describe('Phase 078 — Architecture Dependency Rules Documentation Audit', () => {
  it('dependency-rules.md documents prohibited patterns (Controller→SQL, Repository→HTTP)', () => {
    const content = allArchContent();
    expect(content).toContain('Controller');
    expect(content).toContain('Repository');
    expect(content).toContain('Service');
  });
});
