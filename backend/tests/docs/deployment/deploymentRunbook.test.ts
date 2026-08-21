import { describe, it, expect } from 'vitest';
import { deploymentFileContent } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Operational Runbook Audit', () => {
  it('operational-runbook.md covers startup, shutdown, and incident response', () => {
    const content = deploymentFileContent('operational-runbook.md').toLowerCase();
    expect(content).toContain('startup');
    expect(content).toContain('shutdown');
    expect(content).toContain('incident');
  });
});
