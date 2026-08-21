import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 072 — PostgreSQL Data Persistence Audit', () => {
  it('configures persistent named volume postgres_data', () => {
    const composePath = path.resolve(__dirname, '../../../docker/postgres/docker-compose.postgres.yml');
    const content = fs.readFileSync(composePath, 'utf-8');

    expect(content).toContain('postgres_data:/var/lib/postgresql/data');
    expect(content).toContain('name: trimonarch_postgres_data');
  });
});
