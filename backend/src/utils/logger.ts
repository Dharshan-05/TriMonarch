import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          },
        }
      : undefined,
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'headers.authorization',
      'cookie',
      'DATABASE_PASSWORD',
      '*.password',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
});
