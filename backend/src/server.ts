import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { closeDatabasePool, testDatabaseConnection } from './config/database';

const startServer = async () => {
  try {
    // Perform initial database ping test
    const dbStatus = await testDatabaseConnection();
    if (dbStatus.connected) {
      logger.info(`Database connected successfully (latency: ${dbStatus.latencyMs}ms)`);
    } else {
      logger.warn(`Database connection warning: ${dbStatus.error}`);
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await closeDatabasePool();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled Rejection detected');
    });

    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught Exception detected');
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
};

void startServer();
