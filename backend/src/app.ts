import express, { Express } from 'express';
import cors from 'cors';
import { configureSecurityHeaders } from './middleware/security';
import { methodGuard } from './middleware/methodGuard';
import { contentTypeGuard } from './middleware/contentTypeGuard';
import { parameterPollutionGuard } from './middleware/requestLimits';
import healthRoutes from './health';
import metricsRoutes from './observability/metrics';
import docsRoutes from './docs/openapi';
import { requestLogger } from './middleware/requestLogger';
import apiV1Routes from './routes/api.v1.routes';
import { requestIdHandler } from './middleware/requestId';
import { idempotencyHandler } from './middleware/idempotency';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimit';
import { env } from './config/env';
import { CorsDeniedError } from './types';

export const createApp = (): Express => {
  const app = express();

  // 1. Strict HTTP Method Guard
  app.use(methodGuard);

  // 2. Security Headers (Helmet, CSP, HSTS, X-Content-Type-Options, etc.)
  app.use(configureSecurityHeaders());

  // 3. Strict CORS Hardening
  const allowedOrigins =
    env.CORS_ORIGIN === '*'
      ? '*'
      : env.CORS_ORIGIN.split(',').map((s) => s.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (allowedOrigins === '*') {
          callback(null, true);
        } else if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new CorsDeniedError(`CORS origin '${origin}' is not permitted`));
        }
      },
      credentials: env.CORS_CREDENTIALS,
      methods: env.CORS_METHODS
        ? env.CORS_METHODS.split(',')
        : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: env.CORS_ALLOWED_HEADERS
        ? env.CORS_ALLOWED_HEADERS.split(',')
        : ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
    }),
  );

  // 4. Request Correlation ID
  app.use(requestIdHandler);

  // 5. Request Logging & Metrics Middleware
  app.use(requestLogger);

  // 6. Global Rate Limiter
  app.use(globalRateLimiter);

  // 7. Content-Type Enforcement
  app.use(contentTypeGuard);

  // 8. Body Parsing Middleware with configured size limits
  app.use(express.json({ limit: env.BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));

  // 9. HTTP Parameter Pollution Guard & Prototype Pollution Defense
  app.use(parameterPollutionGuard);

  // 10. Idempotency Handler
  app.use(idempotencyHandler);

  // Health, Readiness, Metrics, and OpenAPI Documentation Routes
  app.use(healthRoutes);
  app.use(metricsRoutes);
  app.use(docsRoutes);

  // Protected Domain API v1 Routes
  app.use('/api/v1', apiV1Routes);

  // 404 Handler for unmapped routes
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
