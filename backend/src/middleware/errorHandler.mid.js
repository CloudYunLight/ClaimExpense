const logger = require('../utils/logger');

// 只要声明了这四个参数， express会自动调用这个函数，用于处理错误
/*
  使用方法
  const err = new Error('Something went wrong!');
  err.status = 500;
  next(err); // 传递错误给错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.log("err01");
  // 记录错误日志
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 现在这个根据err.name 捕获错误的功能还无法正常使用
  // 根据错误类型返回适当的错误响应
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      msg: err.message || '验证错误',
      data: null,
      timestamp: Date.now()
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      code: 401,
      msg: '认证失败，请重新登录',
      data: null,
      timestamp: Date.now()
    });
  }

  // 默认错误响应
  res.status(500).json({
    code: 500,
    msg: '服务器内部错误',
    data: null,
    timestamp: Date.now()
  });
};

// 404中间件
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    code: 404,
    msg: '接口不存在',
    data: null,
    timestamp: Date.now()
  });
  // 404 不会进入 errorHandler 中间件
  // 但是 在app.js 的`res.on`会捕获 >400 的状态码
};

module.exports = {
  errorHandler,
  notFoundHandler
};