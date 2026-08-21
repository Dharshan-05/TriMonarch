import { describe, it, expect } from 'vitest';
import { deploymentFileContent } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Structure Audit', () => {
  it('README.md lists all deployment documentation sections', () => {
    const content = deploymentFileContent('README.md');
    expect(content).toContain('deployment-overview.md');
    expect(content).toContain('docker-deployment.md');
    expect(content).toContain('production-deployment.md');
    expect(content).toContain('environment-configuration.md');
  });
});
