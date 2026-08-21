import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 072 — PostgreSQL Health Check Audit', () => {
  it('configures pg_isready health check with intervals and retries', () => {
    const composePath = path.resolve(__dirname, '../../../docker/postgres/docker-compose.postgres.yml');
    const content = fs.readFileSync(composePath, 'utf-8');

    expect(content).toContain('pg_isready');
    expect(content).toContain('interval: 10s');
    expect(content).toContain('retries: 5');
  });
});
