import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 073 — Development Docker Compose Configuration Audit', () => {
  it('defines development compose file orchestrating backend and postgres services', () => {
    const composePath = path.resolve(__dirname, '../../docker-compose.dev.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    const content = fs.readFileSync(composePath, 'utf-8');
    expect(content).toContain('backend:');
    expect(content).toContain('postgres:');
    expect(content).toContain('trimonarch-network');
  });
});
