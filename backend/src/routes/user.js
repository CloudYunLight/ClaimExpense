const express = require('express');
const { authenticateToken, requireAdminRole } = require('../middleware/auth');
const User = require('../models/User');
const crypto = require('crypto');
const logger = require('../utils/logger');

const router = express.Router();

// 获取用户列表（仅管理员）
router.get('/users', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 10, username, realName, status } = req.query;
    
    const filters = {};
    if (username) filters.username = username;
    if (realName) filters.realName = realName;
    if (status !== undefined) filters.status = status;
    
    const result = await User.getUsers(parseInt(pageNum), parseInt(pageSize), filters);
    
    // 记录操作日志
    logger.info('Admin viewed user list', {
      adminId: req.user.userId,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      code: 200,
      msg: '查询成功',
      data: {
        total: result.total,
        pages: Math.ceil(result.total / result.pageSize),
        current: result.pageNum,
        size: result.pageSize,
        records: result.records
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 新增用户（仅管理员）
router.post('/addUsers', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const { username, realName } = req.body;
    
    if (!username || !realName) {
      return res.status(400).json({
        code: 400,
        msg: '用户名和真实姓名不能为空',
        data: null,
        timestamp: Date.now()
      });
    }
    
    // 检查用户名是否已存在
    const exists = await User.checkUsernameExists(username);
    if (exists) {
      return res.status(409).json({
        code: 409,
        msg: '用户名已存在',
        data: null,
        timestamp: Date.now()
      });
    }
    
    // 生成初始密码
    const initialPassword = crypto.randomBytes(8).toString('hex');
    
    const result = await User.create({
      username,
      password: initialPassword,
      realName,
      role: 0 // 默认为普通用户
    });
    
    // 记录操作日志
    logger.info('Admin created new user', {
      adminId: req.user.userId,
      newUserId: result.userId,
      username: username,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      code: 200,
      msg: '用户创建成功',
      data: {
        userId: result.userId,
        initialPassword: initialPassword
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 重置用户密码（仅管理员）
router.post('/users/:userId/resetPassword', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const result = await User.resetUserPassword(userId);
    
    if (!result.success) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null,
        timestamp: Date.now()
      });
    }
    
    // 记录操作日志
    logger.info('Admin reset user password', {
      adminId: req.user.userId,
      targetUserId: userId,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      code: 200,
      msg: '密码重置成功',
      data: {
        newPassword: result.newPassword
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 启停用户账户（仅管理员）
router.post('/users/:userId/status', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { status } = req.body;
    
    if (status === undefined || (status !== 0 && status !== 1)) {
      return res.status(400).json({
        code: 400,
        msg: '状态值必须为0（锁定）或1（正常）',
        data: null,
        timestamp: Date.now()
      });
    }
    
    const result = await User.updateUserStatus(userId, status);
    
    if (!result) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null,
        timestamp: Date.now()
      });
    }
    
    const statusMsg = status === 1 ? '启用' : '锁定';
    
    // 记录操作日志
    logger.info(`Admin ${statusMsg} user account`, {
      adminId: req.user.userId,
      targetUserId: userId,
      status: status,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      code: 200,
      msg: '账户状态更新成功',
      data: `${statusMsg}成功`,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

module.exports = router;