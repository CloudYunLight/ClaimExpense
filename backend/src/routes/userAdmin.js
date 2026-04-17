const express = require('express');
const { authenticateToken, requireAdminRole } = require('../middleware/auth.mid');
const User = require('../models/User');
const crypto = require('crypto');
const logger = require('../utils/logger');

const router = express.Router();
const { normalizeStatusFilter } = require('../utils/utils_status');

const logAdminAudit = (req, action, outcome, extra = {}) => {
  logger.info('Admin operation audit', {
    action,
    outcome,
    adminId: req.user?.userId,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    ...extra
  });
};

// 获取用户列表（仅管理员）
router.get('/users', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    // http://localhost:3000/api/v1/admin/users?pageNum=1&pageSize=10&username=test&status=1
    /*
    req.query 是 Express 框架自动提供的，它包含了 URL 查询字符串中的参数。
      你不需要手动设置它，而是通过 URL 直接传入参数。
    */
    const { pageNum = 1, pageSize = 10, username, realName, status } = req.query;


    const filters = {};
    if (username) filters.username = username;
    if (realName) filters.realName = realName;
    const normalizedStatus = normalizeStatusFilter(status);
    if (normalizedStatus !== undefined) filters.status = normalizedStatus;

    const result = await User.getUsers(parseInt(pageNum), parseInt(pageSize), filters);
    logAdminAudit(req, 'list_users', 'success', {
      query: { pageNum: parseInt(pageNum), pageSize: parseInt(pageSize), ...filters },
      total: result.total
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
    logAdminAudit(req, 'list_users', 'error', {
      error: error.message
    });
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
    const { usernameAdd, realNameAdd } = req.body;

    if (!usernameAdd || !realNameAdd) {
      logAdminAudit(req, 'create_user', 'validation_failed', {
        reason: 'usernameAdd or realNameAdd is empty',
        usernameAdd: usernameAdd || null
      });
      return res.status(400).json({
        code: 400,
        msg: '新增的用户名和真实姓名不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    // 检查用户名是否已存在
    const exists = await User.checkUsernameExists(usernameAdd);
    if (exists) {
      logAdminAudit(req, 'create_user', 'conflict', {
        reason: 'username already exists',
        usernameAdd
      });
      return res.status(409).json({
        code: 409,
        msg: '用户名已存在',
        data: null,
        timestamp: Date.now()
      });
    }

    // 生成初始密码
    const initialPassword = crypto.randomBytes(4).toString('hex');  // 修改：使用4字节生成8位十六进制字符

    const result = await User.create({
      username: usernameAdd,
      password: initialPassword,
      realName: realNameAdd,  // 修改：将realname改为realName
      role: 0 // 默认为普通用户
    });

    logAdminAudit(req, 'create_user', 'success', {
      newUserId: result.userId,
      newUsername: usernameAdd
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
    logAdminAudit(req, 'create_user', 'error', {
      error: error.message
    });
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
      logAdminAudit(req, 'reset_user_password', 'not_found', {
        targetUserId: userId
      });
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null,
        timestamp: Date.now()
      });
    }

    logAdminAudit(req, 'reset_user_password', 'success', {
      targetUserId: userId,
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
    logAdminAudit(req, 'reset_user_password', 'error', {
      targetUserId: parseInt(req.params.userId),
      error: error.message
    });
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

    // 修复：转换为数字进行比较或与字符串值比较
    const statusValue = Number(status);
    if (status === undefined || isNaN(statusValue) || (statusValue !== 0 && statusValue !== 1)) {
      logAdminAudit(req, 'update_user_status', 'validation_failed', {
        targetUserId: userId,
        status
      });
      return res.status(400).json({
        code: 400,
        msg: '状态值必须为0（锁定）或1（正常）',
        data: null,
        timestamp: Date.now()
      });
    }

    const result = await User.updateUserStatus(userId, statusValue);

    if (!result) {
      logAdminAudit(req, 'update_user_status', 'not_found', {
        targetUserId: userId,
        status: statusValue
      });
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null,
        timestamp: Date.now()
      });
    }

    const statusMsg = statusValue === 1 ? '启用' : '锁定';

    logAdminAudit(req, 'update_user_status', 'success', {
      targetUserId: userId,
      status: statusValue,
      statusMsg
    });

    res.status(200).json({
      code: 200,
      msg: '账户状态更新成功',
      data: `${statusMsg}成功`,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Update user status error:', error);
    logAdminAudit(req, 'update_user_status', 'error', {
      targetUserId: parseInt(req.params.userId),
      error: error.message
    });
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

module.exports = router;