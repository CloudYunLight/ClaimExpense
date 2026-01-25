const winston = require('winston');
const config = require('./config');
const fs = require('fs');
// 确保logs目录存在
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// 定义自定义日志级别（数字越小，优先级越高）
const levels = {
  error: 0,
  info: 1,
  debug: 2,
};

const logger = winston.createLogger({
  levels: levels,
  level: config.log.level || 'info', // 默认为info级别；只有当高于当前级别才会输出
  format: winston.format.combine( // 格式化日志
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'expense-claim-api' },  // 默认服务名称
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',  // 只记录error级别的日志
      options: { flags: 'w' } // 以覆盖模式写入
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      options: { flags: 'w' }, // 以覆盖模式写入
      // level: config.log.level
    })
  ]
});

// 为访问日志创建单独的transport，专门记录访问信息
logger.add(new winston.transports.File({
  filename: 'logs/access.log',
  options: { flags: 'w' }, // 以覆盖模式写入
  // level: 'info', // 记录info及以上级别的日志
  format: winston.format.combine(
    winston.format.printf((info) => {
      if (typeof info.path !== 'undefined') {
        // 输出Nginx风格的访问日志
        const timestamp = new Date(info.timestamp).toISOString().replace('T', ' ').replace('Z', '');
        return `${info.ip} - - [${timestamp}] "${info.method} ${info.path} HTTP/${info.httpVersion || '1.1'}" ${info.statusCode} ${info.responseSize || '-'} "-" "${info.userAgent || '-'}"`;
      }
      return '';  // 如果有意外的空行，就代表是非访问路径，返回空行
    })
  )
}));

// 如果不是生产环境，则【同时】输出到控制台
if (config.log.level == 'debug') {
  logger.add(new winston.transports.Console({
    level: config.log.level || 'info', // 使用环境变量或默认的日志级别
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf((info) => {
        // 对于包含path信息的日志（访问日志），输出Nginx风格格式
        if (typeof info.path !== 'undefined') {
          return `${info.timestamp} ${info.ip} - - [${info.timestamp.replace('T', ' ').replace('Z', '')}] "${info.method} ${info.path} HTTP/${info.httpVersion || '1.1'}" ${info.statusCode} ${info.responseSize || '-'} "-" "${info.userAgent || '-'}"`;
        }
        // 对于其他级别的日志，按原格式输出
        return `${info.timestamp} [${info.level}] ${info.message}`;
      })
    )
  }));
}


module.exports = logger;