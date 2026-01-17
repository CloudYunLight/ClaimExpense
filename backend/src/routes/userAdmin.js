const express = require('express');
const { authenticateToken, requireAdminRole } = require('../middleware/auth.mid');
const User = require('../models/User');
const crypto = require('crypto');
const logger = require('../utils/logger');

const router = express.Router();

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
    const { usernameAdd, realNameAdd } = req.body;

    if (!usernameAdd || !realNameAdd) {
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

    // 记录操作日志
    logger.info('Admin created new user', {
      adminId: req.user.userId,
      newUserId: result.userId,
      newUsername: usernameAdd,
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

    // 修复：转换为数字进行比较或与字符串值比较
    const statusValue = Number(status);
    if (status === undefined || isNaN(statusValue) || (statusValue !== 0 && statusValue !== 1)) {
      return res.status(400).json({
        code: 400,
        msg: '状态值必须为0（锁定）或1（正常）',
        data: null,
        timestamp: Date.now()
      });
    }

    const result = await User.updateUserStatus(userId, statusValue);

    if (!result) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null,
        timestamp: Date.now()
      });
    }

    const statusMsg = statusValue === 1 ? '启用' : '锁定';

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