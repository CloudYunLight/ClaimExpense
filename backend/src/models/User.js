const DatabaseUtil = require('../utils/database');
const bcrypt = require('bcryptjs');
const config = require('../utils/config');
const crypto = require('crypto');  // 添加：引入Node.js内置的crypto模块
const { normalizeStatusFilter } = require('../utils/utils_status');


// 用户表结构定义
const User = {
  // 创建用户
  create: async (userData) => {
    const { username, password, realName, role = 0 } = userData;
    const hashedPassword = await bcrypt.hash(password, parseInt(config.bcrypt.saltRounds));
    const query = 'INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)';
    
    const result = await DatabaseUtil.execute(query, [username, hashedPassword, realName, role, 1]);
    
    return { userId: result.insertId };
  },

  // 根据用户名查找用户
  findByUsername: async (username) => {
    const query = 'SELECT * FROM users WHERE username = ?';

    const rows = await DatabaseUtil.execute(query, [username]);
    // 下面的编码，用于解决不存在的用户时，返回null（避免返回空，造成数组访问出错，undefined）
    // console.log(rows)
    return rows && rows.length > 0 ? rows[0] : null;
  },

  // 根据ID查找用户
  findById: async (userId) => {
    const query = 'SELECT * FROM users WHERE user_id = ?';
    const rows = await DatabaseUtil.execute(query, [userId]);
    // console.log(rows)
    return rows[0];
  },

  // 验证密码
  validatePassword: async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
  },

  // 获取用户列表（分页）
  getUsers: async (pageNum = 1, pageSize = 10, filters = {}) => {
    const { username, realName, status } = filters; // 获取过滤条件
    const normalizedStatus = normalizeStatusFilter(status);
    const offset = (pageNum - 1) * pageSize;  // 计算偏移量
    
    // 实在的查询用户内容
    let query = 'SELECT user_id as userId, username, real_name as realName, role, status, create_time as createTime FROM users WHERE 1=1';
    let params = [];  // 存储查询参数
    
    if (username) {
      query += ' AND username LIKE ?';
      params.push(`%${username}%`); // 粗匹配
    }
    
    if (realName) {
      query += ' AND real_name LIKE ?';
      params.push(`%${realName}%`); // 粗匹配
    }
    
    if (normalizedStatus !== undefined) {
      query += ' AND status = ?';
      params.push(normalizedStatus);
    }
    
    query += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));  // 分页
    
    // 返回总个数
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';  // 改为let而不是const
    let countParams = [];
    
    if (username) {
      countQuery += ' AND username LIKE ?';
      countParams.push(`%${username}%`);
    }
    
    if (realName) {
      countQuery += ' AND real_name LIKE ?';
      countParams.push(`%${realName}%`);
    }
    
    if (normalizedStatus !== undefined) {
      countQuery += ' AND status = ?';
      countParams.push(normalizedStatus);
    }
    const countResult = await DatabaseUtil.execute(countQuery, countParams);  // 解构返回的结果
    // console.log("数量查询结果",countResult)
    // 要对返回为空的情况做处理
    const total = countResult.length > 0 ? countResult[0].total : 0;

    const rows = await DatabaseUtil.execute(query, params);
    // console.log("查询结果",rows)
    
    return {
      total: total,  // 使用之前计算好的total变量
      pageNum: parseInt(pageNum),
      pageSize: parseInt(pageSize),
      records: rows
    };
  },

  // 更新用户状态
  updateUserStatus: async (userId, status) => {
    const query = 'UPDATE users SET status = ? WHERE user_id = ?';
    const result = await DatabaseUtil.execute(query, [status, userId]);
    // console.log(result);
    return result.affectedRows > 0;
  },

  // 重置用户密码
  resetUserPassword: async (userId) => {
    // 生成随机密码
    let newPassword = crypto.randomBytes(4).toString('hex');  // 修改：使用4字节生成8位十六进制字符
    
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(config.bcrypt.saltRounds));
    const query = 'UPDATE users SET password = ? WHERE user_id = ?';
    const result = await DatabaseUtil.execute(query, [hashedPassword, userId]);
    
    return {
      success: result? (result.affectedRows > 0): false,
      newPassword
    };
  },

  // 检查用户名是否已存在
  checkUsernameExists: async (username) => {
    const query = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const rows = await DatabaseUtil.execute(query, [username]);
    return rows[0].count > 0;
  }
};

module.exports = User;