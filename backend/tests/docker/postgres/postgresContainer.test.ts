import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 072 — PostgreSQL Container Specification Audit', () => {
  it('defines containerized PostgreSQL service with pinned version and alpine base', () => {
    const composePath = path.resolve(__dirname, '../../../docker/postgres/docker-compose.postgres.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    const content = fs.readFileSync(composePath, 'utf-8');
    expect(content).toContain('postgres:16-alpine');
    expect(content).not.toContain('postgres:latest');
    expect(content).toContain('trimonarch-postgres');
  });
});
