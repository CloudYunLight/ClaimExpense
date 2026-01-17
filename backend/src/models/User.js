const DatabaseUtil = require('../utils/database');
const bcrypt = require('bcryptjs');

// 用户表结构定义
const User = {
  // 创建用户
  create: async (userData) => {
    const { username, password, realName, role = 0 } = userData;
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS || 10));
    const query = 'INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)';
    
    const [result] = await DatabaseUtil.execute(query, [username, hashedPassword, realName, role, 1]);
    return { userId: result.insertId };
  },

  // 根据用户名查找用户
  findByUsername: async (username) => {
    const query = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await DatabaseUtil.execute(query, [username]);
    return rows[0];
  },

  // 根据ID查找用户
  findById: async (userId) => {
    const query = 'SELECT * FROM users WHERE user_id = ?';
    const [rows] = await DatabaseUtil.execute(query, [userId]);
    return rows[0];
  },

  // 验证密码
  validatePassword: async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
  },

  // 获取用户列表（分页）
  getUsers: async (pageNum = 1, pageSize = 10, filters = {}) => {
    const { username, realName, status } = filters;
    const offset = (pageNum - 1) * pageSize;
    
    let query = 'SELECT user_id as userId, username, real_name as realName, role, status, create_time as createTime FROM users WHERE 1=1';
    const params = [];
    
    if (username) {
      query += ' AND username LIKE ?';
      params.push(`%${username}%`);
    }
    
    if (realName) {
      query += ' AND real_name LIKE ?';
      params.push(`%${realName}%`);
    }
    
    if (status !== undefined && status !== null) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    
    if (username) {
      countQuery += ' AND username LIKE ?';
      countParams.push(`%${username}%`);
    }
    
    if (realName) {
      countQuery += ' AND real_name LIKE ?';
      countParams.push(`%${realName}%`);
    }
    
    if (status !== undefined && status !== null) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await DatabaseUtil.execute(countQuery, countParams);
    const [rows] = await DatabaseUtil.execute(query, params);
    
    return {
      total: countResult[0].total,
      pageNum: parseInt(pageNum),
      pageSize: parseInt(pageSize),
      records: rows
    };
  },

  // 更新用户状态
  updateUserStatus: async (userId, status) => {
    const query = 'UPDATE users SET status = ? WHERE user_id = ?';
    const [result] = await DatabaseUtil.execute(query, [status, userId]);
    return result.affectedRows > 0;
  },

  // 重置用户密码
  resetUserPassword: async (userId) => {
    // 生成随机密码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let newPassword = '';
    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS || 10));
    const query = 'UPDATE users SET password = ? WHERE user_id = ?';
    const [result] = await DatabaseUtil.execute(query, [hashedPassword, userId]);
    
    return {
      success: result.affectedRows > 0,
      newPassword
    };
  },

  // 检查用户名是否已存在
  checkUsernameExists: async (username) => {
    const query = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const [rows] = await DatabaseUtil.execute(query, [username]);
    return rows[0].count > 0;
  }
};

module.exports = User;