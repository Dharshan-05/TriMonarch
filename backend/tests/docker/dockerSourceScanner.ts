import fs from 'fs';
import path from 'path';

export interface DockerFinding {
  rule: string;
  file: string;
  detail: string;
}

export const scanDockerSourceTree = (projectDir: string = path.resolve(__dirname, '../../')): DockerFinding[] => {
  const findings: DockerFinding[] = [];
  const dockerfilePath = path.join(projectDir, 'Dockerfile');

  if (!fs.existsSync(dockerfilePath)) {
    findings.push({ rule: 'DOCKERFILE_EXISTS', file: 'Dockerfile', detail: 'Dockerfile missing' });
    return findings;
  }

  const content = fs.readFileSync(dockerfilePath, 'utf-8');

  if (/USER\s+root/i.test(content)) {
    findings.push({ rule: 'NON_ROOT_USER', file: 'Dockerfile', detail: 'Runs explicitly as root' });
  }

  if (/COPY\s+\.env/i.test(content)) {
    findings.push({ rule: 'NO_ENV_COPY', file: 'Dockerfile', detail: 'Copies .env file into image' });
  }

  if (/JWT_SECRET\s*=\s*['"]?[a-zA-Z0-9_-]+/i.test(content)) {
    findings.push({ rule: 'NO_HARDCODED_SECRETS', file: 'Dockerfile', detail: 'Contains hardcoded JWT secret' });
  }

  return findings;
};
