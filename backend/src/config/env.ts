import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
      message: 'PORT must be a valid port number (1-65535)',
    }),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  DATABASE_HOST: z.string().min(1, 'DATABASE_HOST is required').default('localhost'),
  DATABASE_PORT: z
    .string()
    .default('5432')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
      message: 'DATABASE_PORT must be a valid port number',
    }),
  DATABASE_NAME: z.string().min(1, 'DATABASE_NAME is required').default('erp_db'),
  DATABASE_USER: z.string().min(1, 'DATABASE_USER is required').default('postgres'),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_SSL: z
    .string()
    .default('false')
    .transform((val) => val === 'true' || val === '1'),

  JWT_SECRET: z
    .string()
    .default('development-super-secret-key-32-chars-long')
    .refine((val) => val.length >= 32, {
      message: 'JWT_SECRET must be at least 32 characters long',
    }),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (environment: Record<string, unknown> = process.env): Env => {
  const result = envSchema.safeParse(environment);

  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error('Invalid environment variables:', JSON.stringify(formattedErrors, null, 2));
    throw new Error(`Environment validation failed: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
  }

  return result.data;
};

export const env = validateEnv();
