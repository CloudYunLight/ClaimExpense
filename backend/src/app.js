const express = require('express');
const cors = require('cors');
const config = require('./utils/config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');

const app = express();

// 应用API限流中间件
app.use(limiter);

// 记录请求日志的中间件
app.use((req, res, next) => {
  // 获取真实的客户端IP地址
  const getClientIp = (req) => {
    // 检查 X-Forwarded-For 头
    let ip = req.headers['x-forwarded-for'] ||  // 这是 HTTP 请求头字段
      req.connection.remoteAddress ||   /// 这是 TCP 连接字段，是直接连接到服务器的IP
      req.socket.remoteAddress ||        // Socket 模块的字段，是直接连接到服务器的IP
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

  // 记录访问日志 - 基本访问信息使用 info 级别
  if (config.log.level === 'info') {
    logger.info({
      message: 'Request Started',
      method: req.method,
      path: req.path,
      ip: clientIp,
      userAgent: req.get('User-Agent'),
    });
  }
  else if (config.log.level === 'debug') {
    logger.debug({
      message: 'Request Started',
      method: req.method,
      path: req.path,
      ip: clientIp,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      accept: req.get('Accept'),
      httpVersion: req.httpVersion,
      headers: req.headers,
      responseSize: res.get('Content-Length') || '-'
    });
  }



  // 为响应对象绑定了一个事件监听器，当响应完成（发送完所有响应数据）时触发回调函数。
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // 记录访问日志 - 请求完成信息
    logger.debug({
      message: 'Request Completed',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: clientIp,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      httpVersion: req.httpVersion,
      responseSize: res.get('Content-Length') || '-',
      userAgent: req.get('User-Agent') || '-'
    });

    // 记录错误日志（状态码 >= 400）- 错误信息使用 error 级别
    if (res.statusCode >= 400) {
      logger.error('Request Error', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: clientIp,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent')
      });
    }

    // 记录详细请求/响应日志
    logger.debug({
      message: 'Response Details',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: clientIp,
      duration: `${duration}ms`,
      requestHeaders: req.headers,
      requestBody: req.body && Object.keys(req.body).length > 0 ? req.body : 'empty',
      responseHeaders: res.getHeaders(),
      responseSize: res.get('Content-Length') || '-'
    });
  });

  next();
  /*
  next(); 位于请求日志记录中间件的末尾，
    它的作用是告诉 Express 继续执行后续的中间件或路由处理函数。
  
    在 Express.js 中，next() 函数是中间件函数的第三个参数，
    它的作用是将控制权传递给下一个中间件函数。
  */
});

// 中间件；其添加顺序就是请求到达服务器的执行顺序

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 健康检查端点 - 支持所有HTTP方法
// 如果要限制响应仅支持GET方法，只需要改成 app.get()
app.all('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
    message: 'Expense Claim API is running smoothly',
    method: req.method,
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

// 404处理中间件；放在所有路由之后
app.use(notFoundHandler);

// 错误处理中间件
app.use(errorHandler);

module.exports = app;
/*
  将当前文件中创建和配置好的 Express app 实例导出，
  这样其他文件就可以通过 require('./app') 来引入和使用这个配置好的 Express 应用实例。
*/