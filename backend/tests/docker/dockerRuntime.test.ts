import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 071 — Docker Runtime Security Configuration Audit', () => {
  it('configures non-root user execution in production image stage', () => {
    const dockerfilePath = path.resolve(__dirname, '../../Dockerfile');
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    expect(content).toContain('USER node');
    expect(content).toContain('EXPOSE 8000');
    expect(content).toContain('ENV NODE_ENV=production');
  });
});
