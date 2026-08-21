import { describe, it, expect } from 'vitest';
import { archFileContent } from './architectureDocumentationScanner';

describe('Phase 078 — Architecture Structure Documentation Audit', () => {
  it('project-structure.md documents controllers, services, repositories, middleware, schemas', () => {
    const content = archFileContent('project-structure.md');
    expect(content).toContain('controllers');
    expect(content).toContain('services');
    expect(content).toContain('repositories');
    expect(content).toContain('middleware');
    expect(content).toContain('schemas');
  });
});
