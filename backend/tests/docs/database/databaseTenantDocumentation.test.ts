import { describe, it, expect } from 'vitest';
import { docFileContent } from './databaseDocumentationScanner';

describe('Phase 077 — Database Tenant Isolation Documentation Audit', () => {
  it('tenant-isolation.md documents organization_id and multi-tenant model', () => {
    const content = docFileContent('tenant-isolation.md');
    expect(content).toContain('organization_id');
    expect(content.toLowerCase()).toContain('tenant');
  });
});
