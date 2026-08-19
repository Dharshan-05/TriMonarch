import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health.routes';
import apiV1Routes from './routes/api.v1.routes';
import { requestIdHandler } from './middleware/requestId';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Express => {
  const app = express();

  // Basic security and correlation middleware
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(requestIdHandler);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use(healthRoutes);
  app.use('/api/v1', apiV1Routes);

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
