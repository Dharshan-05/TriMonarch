import * as fs from 'fs';
import * as path from 'path';

export const DOCS_DEPLOYMENT_DIR = path.resolve(__dirname, '../../../docs/deployment');

export const REQUIRED_DEPLOYMENT_FILES = [
  'README.md',
  'deployment-overview.md',
  'prerequisites.md',
  'environment-configuration.md',
  'docker-deployment.md',
  'production-deployment.md',
  'database-deployment.md',
  'migration-deployment.md',
  'ci-cd.md',
  'health-checks.md',
  'observability.md',
  'security.md',
  'secrets-management.md',
  'backup-and-recovery.md',
  'rollback.md',
  'zero-downtime-deployment.md',
  'scaling.md',
  'troubleshooting.md',
  'operational-runbook.md',
  'disaster-recovery.md',
];

export const SECRET_PATTERNS = [
  'postgres://user:password@',
  'CHANGE_ME',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'super-secret-key',
  'development-super-secret',
];

export const REQUIRED_SECTIONS: Record<string, string[]> = {
  'deployment-overview.md': ['architecture', 'deployment', 'health'],
  'prerequisites.md': ['node', 'docker', 'postgresql'],
  'environment-configuration.md': ['node_env', 'database_url', 'jwt_secret'],
  'docker-deployment.md': ['multi-stage', 'alpine', 'healthcheck'],
  'production-deployment.md': ['typecheck', 'build', 'migration'],
  'database-deployment.md': ['postgresql', 'connection', 'pool'],
  'migration-deployment.md': ['migration', 'rollback', 'backup'],
  'ci-cd.md': ['quality gates', 'build', 'deploy'],
  'health-checks.md': ['/health', '/health/live', '/health/ready'],
  'observability.md': ['logging', 'metrics', 'correlation'],
  'security.md': ['non-root', 'isolation', 'validation'],
  'secrets-management.md': ['jwt', 'placeholder', 'rotation'],
  'backup-and-recovery.md': ['backup', 'recovery', 'rpo'],
  'rollback.md': ['rollback', 'application', 'database'],
  'zero-downtime-deployment.md': ['rolling', 'readiness', 'drain'],
  'scaling.md': ['horizontal', 'stateless', 'connection'],
  'troubleshooting.md': ['symptoms', 'causes', 'resolution'],
  'operational-runbook.md': ['startup', 'shutdown', 'checklist'],
  'disaster-recovery.md': ['disaster', 'restoration', 'verification'],
};

export const deploymentFileExists = (filename: string): boolean =>
  fs.existsSync(path.join(DOCS_DEPLOYMENT_DIR, filename));

export const deploymentFileContent = (filename: string): string => {
  const p = path.join(DOCS_DEPLOYMENT_DIR, filename);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};

export const allDeploymentContent = (): string =>
  REQUIRED_DEPLOYMENT_FILES.map(deploymentFileContent).join('\n');
