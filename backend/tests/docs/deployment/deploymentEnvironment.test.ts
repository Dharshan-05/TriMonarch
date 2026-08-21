import { describe, it, expect } from 'vitest';
import { deploymentFileContent } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Environment Audit', () => {
  it('environment-configuration.md documents fail-fast configuration behavior', () => {
    const content = deploymentFileContent('environment-configuration.md').toLowerCase();
    expect(content).toContain('node_env');
    expect(content).toContain('database_url');
    expect(content).toContain('jwt_secret');
    expect(content).toContain('fail-fast');
  });
});
