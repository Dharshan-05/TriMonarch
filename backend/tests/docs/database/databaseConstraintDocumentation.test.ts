import { describe, it, expect } from 'vitest';
import { docFileContent } from './databaseDocumentationScanner';

describe('Phase 077 — Database Constraint Documentation Audit', () => {
  it('constraints.md documents PostgreSQL error codes and constraint types', () => {
    const content = docFileContent('constraints.md');
    expect(content).toContain('23505');
    expect(content).toContain('23503');
    expect(content.toLowerCase()).toContain('foreign key');
  });
});
