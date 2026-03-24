import { buildApp } from './app.js';
import { getConfig } from './config/index.js';
import { createLogger } from '@riskradar/logger';

const logger = createLogger('server');

async function start(): Promise<void> {
  const config = getConfig();
  const app = await buildApp();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      try {
        await app.close();
        logger.info('Server closed');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });
  }

  // Unhandled rejections
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception — shutting down');
    process.exit(1);
  });

  try {
    await app.listen({
      host: config.API_HOST,
      port: config.API_PORT,
    });
    logger.info(
      `RiskRadar API running at http://${config.API_HOST}:${config.API_PORT}`,
    );
    logger.info(`API docs at http://localhost:${config.API_PORT}/docs`);
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
