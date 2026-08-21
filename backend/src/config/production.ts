import { Env } from './env';

export class ProductionConfigError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Production configuration validation failed:\n- ${errors.join('\n- ')}`);
    this.name = 'ProductionConfigError';
  }
}

const INSECURE_JWT_SECRETS = new Set([
  'development-super-secret-key-32-chars-long',
  'development-access-secret-key-32-chars-long',
  'development-refresh-secret-key-32-chars-long',
  'CHANGE_ME',
  'replace-with-a-secure-secret-key-at-least-32-chars',
]);

const INSECURE_DB_PASSWORDS = new Set([
  '',
  'postgres',
  'admin',
  'password',
  '123456',
  'CHANGE_ME',
  'root',
]);

export interface ProductionConfigValidationOptions {
  allowLocalhostDb?: boolean;
  allowWildcardCors?: boolean;
}

export const validateProductionConfig = (
  envData: Env,
  options: ProductionConfigValidationOptions = {},
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (envData.NODE_ENV !== 'production') {
    return { valid: true, errors: [] };
  }

  // 1. Secret Protection Validation
  const jwtSecret = envData.JWT_SECRET || '';
  if (INSECURE_JWT_SECRETS.has(jwtSecret) || jwtSecret.length < 32) {
    errors.push('JWT_SECRET uses an insecure development default or is shorter than 32 characters');
  }

  const jwtAccessSecret = envData.JWT_ACCESS_SECRET || '';
  if (INSECURE_JWT_SECRETS.has(jwtAccessSecret) || jwtAccessSecret.length < 32) {
    errors.push('JWT_ACCESS_SECRET uses an insecure development default or is shorter than 32 characters');
  }

  const jwtRefreshSecret = envData.JWT_REFRESH_SECRET || '';
  if (INSECURE_JWT_SECRETS.has(jwtRefreshSecret) || jwtRefreshSecret.length < 32) {
    errors.push('JWT_REFRESH_SECRET uses an insecure development default or is shorter than 32 characters');
  }

  const dbPassword = envData.DATABASE_PASSWORD || '';
  if (INSECURE_DB_PASSWORDS.has(dbPassword)) {
    errors.push('DATABASE_PASSWORD uses an insecure default, empty string, or known placeholder');
  }

  // 2. CORS Security Validation
  if (!options.allowWildcardCors && envData.CORS_ORIGIN === '*' && envData.CORS_CREDENTIALS) {
    errors.push('CORS_ORIGIN cannot be wildcard "*" when CORS_CREDENTIALS is true in production');
  }

  // 3. Database Host Validation
  if (!options.allowLocalhostDb && (envData.DATABASE_HOST === 'localhost' || envData.DATABASE_HOST === '127.0.0.1')) {
    errors.push('DATABASE_HOST points to localhost/127.0.0.1 without explicit production overrides');
  }

  // 4. Rate Limiting Validation
  if (!envData.GLOBAL_RATE_LIMIT || envData.GLOBAL_RATE_LIMIT <= 0 || isNaN(envData.GLOBAL_RATE_LIMIT)) {
    errors.push('GLOBAL_RATE_LIMIT must be a positive integer');
  }

  if (!envData.GLOBAL_RATE_WINDOW_MS || envData.GLOBAL_RATE_WINDOW_MS <= 0 || isNaN(envData.GLOBAL_RATE_WINDOW_MS)) {
    errors.push('GLOBAL_RATE_WINDOW_MS must be a positive integer');
  }

  if (!envData.AUTH_RATE_LIMIT || envData.AUTH_RATE_LIMIT <= 0 || isNaN(envData.AUTH_RATE_LIMIT)) {
    errors.push('AUTH_RATE_LIMIT must be a positive integer');
  }

  if (!envData.AUTH_RATE_WINDOW_MS || envData.AUTH_RATE_WINDOW_MS <= 0 || isNaN(envData.AUTH_RATE_WINDOW_MS)) {
    errors.push('AUTH_RATE_WINDOW_MS must be a positive integer');
  }

  // 5. Query and Request Payload Validation
  if (!envData.QUERY_PARAMETER_LIMIT || envData.QUERY_PARAMETER_LIMIT <= 0 || isNaN(envData.QUERY_PARAMETER_LIMIT)) {
    errors.push('QUERY_PARAMETER_LIMIT must be a positive integer');
  }

  if (errors.length > 0) {
    throw new ProductionConfigError(errors);
  }

  return { valid: true, errors: [] };
};
