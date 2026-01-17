const jwt = require('jsonwebtoken');
const config = require('../utils/config');

const authenticateToken = (req, res, next) => {
  // 从请求头获取Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      code: 401,
      msg: '未提供访问令牌',
      data: null,
      timestamp: Date.now()
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({
        code: 403,
        msg: '令牌无效或已过期',
        data: null,
        timestamp: Date.now()
      });
    }
    
    req.user = user; // 将用户信息附加到请求对象
    next();
  });
};

// 检查用户角色是否为管理员
const requireAdminRole = (req, res, next) => {
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