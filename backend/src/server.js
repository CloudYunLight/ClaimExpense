const app = require('./app');
const config = require('ini').parse(require('fs').readFileSync('../config/config.ini', 'utf-8'));
const logger = require('./utils/logger');

const PORT = config.server.port || 3000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Running on http://0.0.0.0:${PORT}`);
  logger.info(`Check at [GET] http://0.0.0.0:${PORT}/health`);
  
  // 检查详细日志是否启用，兼容字符串和布尔值
  const detailedLogEnabled = config.log && 
    (config.log.detailed_access_log === 'true' || 
     config.log.detailed_access_log === true ||
     config.log.detailed_access_log === '1' ||
     config.log.detailed_access_log === 1);

  if(detailedLogEnabled) {
    logger.info('Detailed access logs are enabled');
  } else {
    logger.info('Detailed access logs are disabled');
  }
  
  // 检查详细请求/响应日志是否启用
  const traceLogEnabled = config.log && 
    (config.log.enable_trace_log === 'true' || 
     config.log.enable_trace_log === true ||
     config.log.enable_trace_log === '1' ||
     config.log.enable_trace_log === 1);

  if(traceLogEnabled) {
    logger.info('Trace logs (request/response details) are enabled');
  } else {
    logger.info('Trace logs (request/response details) are disabled');
  }
});