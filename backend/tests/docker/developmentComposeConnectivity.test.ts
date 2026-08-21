import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 073 — Development Docker Compose Connectivity Audit', () => {
  it('uses service hostname postgres for container-to-container database connectivity', () => {
    const composePath = path.resolve(__dirname, '../../docker-compose.dev.yml');
    const content = fs.readFileSync(composePath, 'utf-8');

    expect(content).toContain('DATABASE_HOST: postgres');
    expect(content).not.toContain('DATABASE_HOST: localhost');
  });
});
