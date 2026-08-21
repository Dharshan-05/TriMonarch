import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 072 — PostgreSQL Migration & Initialization Audit', () => {
  it('mounts initialization script directory into docker-entrypoint-initdb.d', () => {
    const composePath = path.resolve(__dirname, '../../../docker/postgres/docker-compose.postgres.yml');
    const content = fs.readFileSync(composePath, 'utf-8');

    expect(content).toContain('./init:/docker-entrypoint-initdb.d');

    const initScriptPath = path.resolve(__dirname, '../../../docker/postgres/init/01-init.sql');
    expect(fs.existsSync(initScriptPath)).toBe(true);
  });
});
