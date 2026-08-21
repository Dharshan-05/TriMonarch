export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: unknown;
}

const REDACTED_KEYS = new Set([
  'authorization',
  'password',
  'jwt',
  'token',
  'secret',
  'cookie',
  'refresh_token',
  'access_token',
  'database_password',
]);

const sanitizeLogData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('token')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

class StructuredLogger {
  log(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
    const sanitizedMeta = sanitizeLogData(meta);
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...sanitizedMeta,
    };

    const output = JSON.stringify(payload);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(output);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(output);
        break;
    }
  }

  info(message: string, meta: Record<string, unknown> = {}): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta: Record<string, unknown> = {}): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta: Record<string, unknown> = {}): void {
    this.log('error', message, meta);
  }

  debug(message: string, meta: Record<string, unknown> = {}): void {
    this.log('debug', message, meta);
  }
}

export const structuredLogger = new StructuredLogger();
