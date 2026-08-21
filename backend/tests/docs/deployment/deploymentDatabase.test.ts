import { describe, it, expect } from 'vitest';
import { deploymentFileContent } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Database Audit', () => {
  it('database-deployment.md documents PostgreSQL 16 connection pooling and persistence', () => {
    const content = deploymentFileContent('database-deployment.md').toLowerCase();
    expect(content).toContain('postgresql');
    expect(content).toContain('connection pool');
    expect(content).toContain('persistence');
  });
});
