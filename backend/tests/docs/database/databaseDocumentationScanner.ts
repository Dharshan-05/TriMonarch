import * as fs from 'fs';
import * as path from 'path';

export const DOCS_DATABASE_DIR = path.resolve(__dirname, '../../../docs/database');
export const MIGRATIONS_DIR = path.resolve(__dirname, '../../../migrations');

export const REQUIRED_DOC_FILES = [
  'architecture.md',
  'schema.md',
  'relationships.md',
  'tenant-isolation.md',
  'constraints.md',
  'indexes.md',
  'migrations.md',
  'transactions.md',
  'audit-events.md',
  'security.md',
  'development-database.md',
  'testing-database.md',
  'erd.md',
];

export const DOCUMENTED_TABLES = [
  'organizations',
  'users',
  'customers',
  'suppliers',
  'products',
  'warehouses',
  'inventory',
  'stock_ledger',
  'sales_orders',
  'sales_order_items',
  'purchase_orders',
  'purchase_order_items',
  'boms',
  'bom_items',
  'manufacturing_orders',
  'audit_logs',
  'auth_token_revocations',
];

export const CREDENTIAL_PATTERNS = [
  'postgres://user:password@',
  'CHANGE_ME',
  'development-super-secret-key',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
];

export const docFileExists = (filename: string): boolean => {
  return fs.existsSync(path.join(DOCS_DATABASE_DIR, filename));
};

export const docFileContent = (filename: string): string => {
  const filePath = path.join(DOCS_DATABASE_DIR, filename);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
};

export const allDocContent = (): string => {
  return REQUIRED_DOC_FILES.map(docFileContent).join('\n');
};
