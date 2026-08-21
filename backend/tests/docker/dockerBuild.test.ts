import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 071 — Docker Build Multi-Stage Verification', () => {
  it('verifies Dockerfile exists and defines multi-stage build targets', () => {
    const dockerfilePath = path.resolve(__dirname, '../../Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toContain('FROM node:20-alpine AS base');
    expect(content).toContain('FROM base AS dependencies');
    expect(content).toContain('FROM dependencies AS builder');
    expect(content).toContain('FROM base AS production');
  });

  it('verifies .dockerignore excludes sensitive and unneeded files', () => {
    const ignorePath = path.resolve(__dirname, '../../.dockerignore');
    expect(fs.existsSync(ignorePath)).toBe(true);

    const content = fs.readFileSync(ignorePath, 'utf-8');
    expect(content).toContain('node_modules');
    expect(content).toContain('.env');
    expect(content).toContain('coverage');
    expect(content).toContain('tests');
  });
});
