import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 073 — Development Docker Compose Persistence Audit', () => {
  it('reuses named volume trimonarch_postgres_data for data persistence across restarts', () => {
    const composePath = path.resolve(__dirname, '../../docker-compose.dev.yml');
    const content = fs.readFileSync(composePath, 'utf-8');

    expect(content).toContain('postgres_data:/var/lib/postgresql/data');
    expect(content).toContain('name: trimonarch_postgres_data');
  });
});
