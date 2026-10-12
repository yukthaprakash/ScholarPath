import { app } from './app';
import { env } from './config/env';
import { logger } from './middleware/logger';
import { closePool } from './db';

const server = app.listen(env.PORT, () => {
  logger.info({
    event: 'SERVER_STARTED',
    port: env.PORT,
    environment: env.NODE_ENV,
    authMode: env.AUTH_MODE
  }, `ScholarPath Backend listening on port ${env.PORT}`);
});

let isShuttingDown = false;

async function handleGracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, `Received ${signal}. Initiating graceful shutdown...`);

  // Force shutdown safeguard if active connections hang
  const forceShutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing process termination.');
    process.exit(1);
  }, 10000);
  forceShutdownTimer.unref();

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during HTTP server closure');
    } else {
      logger.info('HTTP server closed successfully');
    }

    try {
      await closePool();
      logger.info('Database pool connections closed successfully');
      process.exit(0);
    } catch (dbErr) {
      logger.error({ dbErr }, 'Error closing database pool');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason: reason instanceof Error ? reason.message : reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught Exception encountered. Exiting.');
  process.exit(1);
});
