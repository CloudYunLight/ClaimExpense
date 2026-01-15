const express = require('express');
const cors = require('cors');
const config = require('ini').parse(require('fs').readFileSync('../config/config.ini', 'utf-8'));
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = config.server.port || 3000;

// 应用API限流中间件
app.use(limiter);

// 记录请求日志的中间件
app.use((req, res, next) => {
  // 获取真实的客户端IP地址
  const getClientIp = (req) => {
    // 检查 X-Forwarded-For 头
    let ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress || 
             (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // 如果 X-Forwarded-For 包含多个IP，取第一个（最前面的客户端）
    if (typeof ip === 'string' && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    // 处理 IPv6 映射的 IPv4 地址格式
    if (ip && ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    
    return ip || 'unknown';
  };

  const clientIp = getClientIp(req);
  const startTime = Date.now();
  
  // 检查是否启用详细访问日志
  const enableDetailedAccessLog = config.log && 
    (config.log.detailed_access_log === 'true' || 
     config.log.detailed_access_log === true ||
     config.log.detailed_access_log === '1' ||
     config.log.detailed_access_log === 1);

  // 检查是否启用详细请求/响应日志
  const enableTraceLog = config.log && 
    (config.log.enable_trace_log === 'true' || 
     config.log.enable_trace_log === true ||
     config.log.enable_trace_log === '1' ||
     config.log.enable_trace_log === 1);

  // 记录请求开始
  if (enableTraceLog) {
    logger.info('Request Started', {
      method: req.method,
      path: req.path,
      ip: clientIp,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      accept: req.get('Accept'),
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body && Object.keys(req.body).length > 0 ? req.body : 'empty'
    });
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 记录请求完成
    if (enableDetailedAccessLog) {
      logger.info('Request Completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: clientIp,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length'),
        timestamp: new Date().toISOString(),
        httpVersion: req.httpVersion,
        responseSize: res.get('Content-Length') || '-',
        userAgent: req.get('User-Agent') || '-'
      });
    }

    // 记录错误日志（状态码 >= 400）
    if (res.statusCode >= 400) {
      logger.error('Request Error', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: clientIp,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent')
      });
    }

    // 记录详细请求/响应日志
    if (enableTraceLog) {
      logger.info('Request/Response Details', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: clientIp,
        duration: `${duration}ms`,
        requestHeaders: req.headers,
        requestBody: req.body && Object.keys(req.body).length > 0 ? req.body : 'empty',
        responseHeaders: res.getHeaders(),
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Expense Claim API is running smoothly'
  });
});

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const listRoutes = require('./routes/list');
const billRoutes = require('./routes/bill');
const dashboardRoutes = require('./routes/dashboard');

// 使用路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', userRoutes);
app.use('/api/v1/lists', listRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404处理中间件
app.use(notFoundHandler);

// 错误处理中间件
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Expense Claim server is running on http://0.0.0.0:${PORT}`);
  logger.info(`Health check endpoint available at http://0.0.0.0:${PORT}/health`);
  
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