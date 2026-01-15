const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP在windowMs时间内最多请求max次
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
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP在15分钟内最多尝试5次登录
  message: {
    code: 429,
    msg: '登录尝试次数过多，请稍后再试',
    data: null,
    timestamp: Date.now()
  },
});

module.exports = {
  limiter,
  loginLimiter
};