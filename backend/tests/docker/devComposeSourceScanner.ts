import fs from 'fs';
import path from 'path';

export interface DevComposeFinding {
  rule: string;
  file: string;
  detail: string;
}

export const scanDevComposeSourceTree = (projectDir: string = path.resolve(__dirname, '../../')): DevComposeFinding[] => {
  const findings: DevComposeFinding[] = [];
  const composePath = path.join(projectDir, 'docker-compose.dev.yml');

  if (!fs.existsSync(composePath)) {
    findings.push({ rule: 'DEV_COMPOSE_EXISTS', file: 'docker-compose.dev.yml', detail: 'Development Compose file missing' });
    return findings;
  }

  const content = fs.readFileSync(composePath, 'utf-8');

  if (!/postgres:\s*[\s\S]*condition:\s*service_healthy/i.test(content)) {
    findings.push({ rule: 'HEALTH_AWARE_DEPENDENCY', file: 'docker-compose.dev.yml', detail: 'Backend does not depend on postgres service_healthy' });
  }

  if (/DATABASE_HOST:\s*localhost/i.test(content)) {
    findings.push({ rule: 'SERVICE_NAME_NETWORKING', file: 'docker-compose.dev.yml', detail: 'Backend uses localhost for DATABASE_HOST inside container' });
  }

  if (/image:\s*postgres:latest/i.test(content)) {
    findings.push({ rule: 'PINNED_POSTGRES_VERSION', file: 'docker-compose.dev.yml', detail: 'Uses postgres:latest image' });
  }

  return findings;
};
