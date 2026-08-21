import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { DOCS_DEPLOYMENT_DIR, REQUIRED_DEPLOYMENT_FILES, deploymentFileExists } from './deploymentDocumentationScanner';

describe('Phase 079 — Deployment Documentation Structure Audit', () => {
  it('deployment documentation directory exists', () => {
    expect(fs.existsSync(DOCS_DEPLOYMENT_DIR)).toBe(true);
  });

  it('all required deployment documentation files exist', () => {
    const missing = REQUIRED_DEPLOYMENT_FILES.filter(f => !deploymentFileExists(f));
    expect(missing).toEqual([]);
  });
});
