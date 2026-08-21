import { describe, it, expect } from 'vitest';
import { validateEnv } from '../src/config/env';

describe('Environment Validation', () => {
  it('should parse valid environment variables', () => {
    const mockEnv = {
      PORT: '4000',
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn',
      DATABASE_HOST: 'db.example.com',
      DATABASE_PORT: '5433',
      DATABASE_NAME: 'test_db',
      DATABASE_USER: 'admin',
      DATABASE_PASSWORD: 'secretpassword123!#$',
      DATABASE_SSL: 'true',
      JWT_SECRET: 'a-super-secret-production-jwt-secret-key-32-chars',
      JWT_ACCESS_SECRET: 'a-super-secret-production-access-secret-key-32-chars',
      JWT_REFRESH_SECRET: 'a-super-secret-production-refresh-secret-key-32-chars',
      CORS_ORIGIN: 'https://app.example.com',
    };

    const parsed = validateEnv(mockEnv);
    expect(parsed.PORT).toBe(4000);
    expect(parsed.NODE_ENV).toBe('production');
    expect(parsed.LOG_LEVEL).toBe('warn');
    expect(parsed.DATABASE_HOST).toBe('db.example.com');
    expect(parsed.DATABASE_PORT).toBe(5433);
    expect(parsed.DATABASE_NAME).toBe('test_db');
    expect(parsed.DATABASE_USER).toBe('admin');
    expect(parsed.DATABASE_PASSWORD).toBe('secretpassword123!#$');
    expect(parsed.DATABASE_SSL).toBe(true);
  });

  it('should throw an error for invalid PORT value', () => {
    const mockEnv = {
      PORT: 'invalid_port',
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '5432',
      DATABASE_NAME: 'test_db',
      DATABASE_USER: 'postgres',
    };

    expect(() => validateEnv(mockEnv)).toThrow();
  });
});
