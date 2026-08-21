import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 073 — Development Docker Compose Health Audit', () => {
  it('configures healthcheck for both postgres and backend services with health-aware dependency', () => {
    const composePath = path.resolve(__dirname, '../../docker-compose.dev.yml');
    const content = fs.readFileSync(composePath, 'utf-8');

    expect(content).toContain('pg_isready');
    expect(content).toContain('http://localhost:');
    expect(content).toContain('condition: service_healthy');
  });
});
