const config = require('./utils/config');
const app = require('./app');
const logger = require('./utils/logger');
const DatabaseUtil = require('./utils/database');

const PORT = config.server.port ;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Running on http://0.0.0.0:${PORT}`);
  logger.info(`Check at [GET] http://0.0.0.0:${PORT}/health`);
  
  // 输出当前日志级别信息
  logger.info(`Current log level: ${logger.level}`);

  DatabaseUtil.testConnection().then(async () => {
    // 数据库连接成功后，检查并初始化管理员账户
    await DatabaseUtil.initializeAdminUser();
  });
});