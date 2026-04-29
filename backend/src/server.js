const config = require('./utils/config');
const app = require('./app');
const logger = require('./utils/logger');
const DatabaseUtil = require('./utils/database');

const PORT = config.server.port ;

const bootstrap = async () => {
  const connected = await DatabaseUtil.testConnection();
  if (!connected) {
    logger.error('Database connection failed, aborting server startup');
    process.exit(1);
  }

  await DatabaseUtil.initializeAdminUser();

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Running on http://0.0.0.0:${PORT}`);
    logger.info(`Check at [GET] http://0.0.0.0:${PORT}/health`);
    logger.info(`Current log level: ${logger.level}`);
  });
};

bootstrap().catch((error) => {
  logger.error('Server bootstrap failed', error);
  process.exit(1);
});