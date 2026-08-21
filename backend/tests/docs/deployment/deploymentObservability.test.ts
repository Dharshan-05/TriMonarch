import { describe, it, expect } from 'vitest';
import { deploymentFileContent } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Observability Audit', () => {
  it('observability.md documents structured logging and correlation IDs', () => {
    const content = deploymentFileContent('observability.md').toLowerCase();
    expect(content).toContain('logging');
    expect(content).toContain('metrics');
    expect(content).toContain('correlation');
  });
});
