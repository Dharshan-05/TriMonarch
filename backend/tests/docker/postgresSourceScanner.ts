import fs from 'fs';
import path from 'path';

export interface PostgresFinding {
  rule: string;
  file: string;
  detail: string;
}

export const scanPostgresSourceTree = (projectDir: string = path.resolve(__dirname, '../../')): PostgresFinding[] => {
  const findings: PostgresFinding[] = [];
  const composePath = path.join(projectDir, 'docker/postgres/docker-compose.postgres.yml');

  if (!fs.existsSync(composePath)) {
    findings.push({ rule: 'POSTGRES_COMPOSE_EXISTS', file: 'docker-compose.postgres.yml', detail: 'Compose file missing' });
    return findings;
  }

  const content = fs.readFileSync(composePath, 'utf-8');

  if (/image:\s*postgres:latest/i.test(content)) {
    findings.push({ rule: 'PINNED_POSTGRES_VERSION', file: 'docker-compose.postgres.yml', detail: 'Uses unpinned postgres:latest image' });
  }

  if (!/healthcheck:/i.test(content)) {
    findings.push({ rule: 'HEALTH_CHECK_CONFIGURED', file: 'docker-compose.postgres.yml', detail: 'Missing healthcheck instruction' });
  }

  if (!/postgres_data:/i.test(content)) {
    findings.push({ rule: 'PERSISTENT_VOLUME_CONFIGURED', file: 'docker-compose.postgres.yml', detail: 'Missing named persistent volume' });
  }

  return findings;
};
