import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 071 — Docker Environment Template Audit', () => {
  it('provides .env.docker.example with safe non-secret placeholders', () => {
    const envExamplePath = path.resolve(__dirname, '../../.env.docker.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);

    const content = fs.readFileSync(envExamplePath, 'utf-8');
    expect(content).toContain('DATABASE_HOST=postgres');
    expect(content).toContain('JWT_SECRET=CHANGE_ME');
    expect(content).toContain('REDIS_HOST=redis');
  });
});
