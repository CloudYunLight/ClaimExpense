const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const logger = require('../utils/logger');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  // 从请求头获取Authorization
  const authHeader = req.headers['authorization'];  // 获取Authorization头，需要有Bearer+空格 分隔开
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      code: 401,
      msg: '未提供访问令牌',
      data: null,
      timestamp: Date.now()
    });
  }

  try {
    // 先校验签名和过期时间，避免无效 token 进入业务层。
    const payload = jwt.verify(token, config.jwt.secret);

    // 再校验数据库中的用户状态，确保账号被禁用或删除后旧 token 立即失效。
    const dbUser = await User.findById(payload.userId);
    if (!dbUser || dbUser.status !== 1) {
      return res.status(401).json({
        code: 401,
        msg: '账号状态异常，请重新登录',
        data: null,
        timestamp: Date.now()
      });
    }

    // 以数据库中的实时角色为准，避免角色变更后旧 token 继续持有旧权限。
    req.user = {
      userId: dbUser.user_id,
      username: dbUser.username,
      role: dbUser.role,
      status: dbUser.status
    };
    next();
  } catch (err) {
    logger.info('[jwt.verify]验证过程报错', err);
    return res.status(401).json({
      code: 401,
      msg: '令牌无效或已过期',
      data: null,
      timestamp: Date.now()
    });
  }
};

// 检查用户角色是否为管理员；这个中间件会要求同时引用authenticateToken 中间件
const requireAdminRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      msg: '未授权访问',
      data: null,
      timestamp: Date.now()
    });
  }

  // 这里使用数据库回填后的实时角色，避免仅依赖 token 中的历史角色。
  if (req.user.role !== 1) {
    return res.status(403).json({
      code: 403,
      msg: '权限不足，仅管理员可执行此操作',
      data: null,
      timestamp: Date.now()
    });
  }
  
  next();
};

// 检查用户角色是否为普通用户
const requireUserRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      msg: '未授权访问',
      data: null,
      timestamp: Date.now()
    });
  }

  // 普通用户接口同样依赖实时角色，保证角色切换后权限即时生效。
  if (req.user.role !== 0) {
    return res.status(403).json({
      code: 403,
      msg: '权限不足，仅普通用户可执行此操作',
      data: null,
      timestamp: Date.now()
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireAdminRole,
  requireUserRole
};