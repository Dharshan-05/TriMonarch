import { describe, it, expect } from 'vitest';
import { SECRET_PATTERNS, allDeploymentContent, deploymentFileContent } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Security Audit', () => {
  it('no real credentials or secrets appear in deployment docs', () => {
    const content = allDeploymentContent();
    const found = SECRET_PATTERNS.filter(p => content.includes(p));
    expect(found).toEqual([]);
  });

  it('security.md covers non-root container, rate limiting, and tenant isolation', () => {
    const content = deploymentFileContent('security.md').toLowerCase();
    expect(content).toContain('non-root');
    expect(content).toContain('rate limit');
    expect(content).toContain('tenant isolation');
  });

  it('secrets-management.md uses placeholders only', () => {
    const content = deploymentFileContent('secrets-management.md');
    expect(content).toContain('<JWT_SECRET>');
    expect(content).toContain('<DATABASE_PASSWORD>');
  });
});
