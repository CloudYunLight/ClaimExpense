const rateLimit = require('express-rate-limit');
const config = require('ini').parse(require('fs').readFileSync('../config/config.ini', 'utf-8'));

const limiter = rateLimit({
  windowMs: config.limiter.windowMin * 60 * 1000, // x分钟
  max: config.limiter.max, // 限制每个IP在windowMs时间内最多请求max次
  message: {
    code: 429,
    msg: '请求过于频繁，请稍后再试',
    data: null,
    timestamp: Date.now()
  },
  standardHeaders: true, // 返回RateLimit头部信息
  legacyHeaders: false, // 不使用x-rateLimit头部
});

// 专门针对登录接口的限流，更严格的限制
const loginLimiter = rateLimit({
  windowMs: config.limiter.windowMin_login * 60 * 1000, // 15分钟
  max: config.limiter.max_login, // 限制每个IP在15分钟内最多尝试5次登录
  message: {
    code: 429,
    msg: '登录尝试次数过多，风控中',
    data: null,
    timestamp: Date.now()
  },
    standardHeaders: false, // 不返回RateLimit头部信息
  legacyHeaders: false, // 不使用x-rateLimit头部
});

module.exports = {
  limiter,
  loginLimiter
};