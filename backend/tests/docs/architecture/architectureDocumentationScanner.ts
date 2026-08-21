import * as fs from 'fs';
import * as path from 'path';

export const DOCS_ARCH_DIR = path.resolve(__dirname, '../../../docs/architecture');

export const REQUIRED_ARCH_FILES = [
  'README.md',
  'overview.md',
  'project-structure.md',
  'request-lifecycle.md',
  'layered-architecture.md',
  'dependency-rules.md',
  'authentication.md',
  'authorization.md',
  'multi-tenancy.md',
  'domains.md',
  'state-machines.md',
  'transactions.md',
  'error-handling.md',
  'validation.md',
  'security.md',
  'observability.md',
  'deployment.md',
  'documentation-guide.md',
];

export const REQUIRED_DOMAINS = [
  'users',
  'products',
  'inventory',
  'sales',
  'purchase',
  'manufacturing',
  'audit',
  'organization',
];

export const SECRET_PATTERNS = [
  'postgres://user:password@',
  'CHANGE_ME',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'super-secret-key',
  'development-super-secret',
];

export const REQUIRED_SECTIONS: Record<string, string[]> = {
  'overview.md': ['architecture', 'layer', 'request'],
  'authentication.md': ['jwt', 'login', 'token'],
  'authorization.md': ['rbac', 'policy', 'permission'],
  'multi-tenancy.md': ['organization_id', 'tenant'],
  'transactions.md': ['begin', 'commit', 'rollback'],
  'error-handling.md': ['400', '401', '403', '500'],
  'observability.md': ['logging', 'metrics', 'health'],
  'deployment.md': ['docker', 'container'],
};

export const archFileExists = (filename: string): boolean =>
  fs.existsSync(path.join(DOCS_ARCH_DIR, filename));

export const archFileContent = (filename: string): string => {
  const p = path.join(DOCS_ARCH_DIR, filename);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};

export const allArchContent = (): string =>
  REQUIRED_ARCH_FILES.map(archFileContent).join('\n');
