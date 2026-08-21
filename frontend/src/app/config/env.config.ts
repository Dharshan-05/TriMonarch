import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string({ required_error: 'VITE_API_BASE_URL is required' })
    .url('VITE_API_BASE_URL must be a valid URL'),
  VITE_API_TIMEOUT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 15000))
    .pipe(z.number().positive()),
  VITE_APP_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  VITE_APP_TITLE: z.string().default('Mini ERP'),
});

const parseEnv = () => {
  const envData = {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
  };

  const result = envSchema.safeParse(envData);

  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.error('Invalid environment variables:\n' + formattedErrors);
    // In production or development, fall back safely or alert developer
    return {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
      VITE_API_TIMEOUT: 15000,
      VITE_APP_ENV: 'development' as const,
      VITE_APP_TITLE: 'Mini ERP',
    };
  }

  return result.data;
};

export const env = parseEnv();
export type EnvConfig = typeof env;
