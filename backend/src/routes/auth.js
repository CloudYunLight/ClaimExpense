const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { loginLimiter } = require('../middleware/rateLimiter.mid');
const logger = require('../utils/logger');
const DatabaseUtil = require('../utils/database');
const config = require('../utils/config');
const { authenticateToken } = require('../middleware/auth.mid');


const router = express.Router();

// 用户登录 - 应用登录限流中间件
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入参数
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        msg: '用户名和密码不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    // 查找用户

    const user = await User.findByUsername(username);
    console.log(user);

    if (!user) {
      return res.status(401).json({
        code: 401,
        msg: '用户名或密码错误',
        data: null,
        timestamp: Date.now()
      });
    }

    // 检查账户状态
    if (user.status === 0) {
      return res.status(401).json({
        code: 401,
        msg: '账户已被锁定，请联系管理员',
        data: null,
        timestamp: Date.now()
      });
    }

    // 验证密码
    const isValidPassword = await User.validatePassword(password, user.password); // password 是输入；user.password 是数据库中的
    if (!isValidPassword) {
      return res.status(401).json({
        code: 401,
        msg: '用户名或密码错误',
        data: null,
        timestamp: Date.now()
      });
    }

    // 记录登录成功的日志
    logger.info('User logged in successfully', {
      userId: user.user_id,
      username: user.username,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // 生成JWT Token
    // 库会自动在 payload 中添加一个 exp（expiration time）字段
    const token = jwt.sign(
      { userId: user.user_id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // 返回成功响应
    res.status(200).json({
      code: 200,
      msg: '登录成功',
      data: {
        token: token,
        userInfo: {
          userId: user.user_id,
          username: user.username,
          realName: user.real_name,
          role: user.role,
          status: user.status
        }
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 修改密码
router.post('/ChangePassword', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user ? req.user.userId : null;

    console.log(req.user)

    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权访问',
        data: null,
        timestamp: Date.now()
      });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        msg: '旧密码和新密码不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null,
        timestamp: Date.now()
      });
    }

    // 验证旧密码
    const isValidOldPassword = await User.validatePassword(oldPassword, user.password);
    if (!isValidOldPassword) {
      return res.status(400).json({
        code: 400,
        msg: '旧密码错误',
        data: null,
        timestamp: Date.now()
      });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, parseInt(config.bcrypt.saltRounds));

    // 更新密码
    const updateQuery = 'UPDATE users SET password = ? WHERE user_id = ?';
    await DatabaseUtil.execute(updateQuery, [hashedNewPassword, userId]);

    // 记录密码修改日志
    logger.info('User password changed', {
      userId: user.user_id,
      username: user.username,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      code: 200,
      msg: '密码修改成功',
      data: null,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 用户登出 - 对于JWT，通常在客户端清除Token即可
router.post('/logout', authenticateToken, (req, res) => {
  // 记录登出日志
  logger.info('User logged out', {
    userId: req.user ? req.user.userId : 'unknown',
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  res.status(200).json({
    code: 200,
    msg: '登出成功',
    data: null,
    timestamp: Date.now()
  });
});

// 获取当前登录用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权访问',
        data: null,
        timestamp: Date.now()
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null,
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      code: 200,
      msg: '查询成功',
      data: {
        userId: user.user_id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        status: user.status
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

module.exports = router;