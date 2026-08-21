import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 071 — Docker Container Health Check Audit', () => {
  it('defines a functional Docker HEALTHCHECK instruction checking /health endpoint', () => {
    const dockerfilePath = path.resolve(__dirname, '../../Dockerfile');
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    expect(content).toContain('HEALTHCHECK');
    expect(content).toContain('/health');
  });
});
