import { describe, it, expect } from 'vitest';
import { deploymentFileContent } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Docker Audit', () => {
  it('docker-deployment.md documents multi-stage builds and non-root execution', () => {
    const content = deploymentFileContent('docker-deployment.md').toLowerCase();
    expect(content).toContain('multi-stage');
    expect(content).toContain('node:20-alpine');
    expect(content).toContain('non-root');
    expect(content).toContain('healthcheck');
  });
});
