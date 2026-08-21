import { describe, it, expect } from 'vitest';
import { deploymentFileContent } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Health Checks Audit', () => {
  it('health-checks.md documents /health, /health/live, and /health/ready endpoints', () => {
    const content = deploymentFileContent('health-checks.md');
    expect(content).toContain('/health');
    expect(content).toContain('/health/live');
    expect(content).toContain('/health/ready');
    expect(content).toContain('200');
    expect(content).toContain('503');
  });
});
