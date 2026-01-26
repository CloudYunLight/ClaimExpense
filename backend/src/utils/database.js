const mysql = require('mysql2/promise');  // 哈！promise版本的才支持我的写法
const config = require('./config');
const logger = require('./logger');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.username,
  password: config.database.password,
  database: config.database.database,
  charset: config.database.charset,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * 数据库工具类
 */
class DatabaseUtil {

  /**
   * 开始事务
   * @returns {Promise}
   * @deprecated 暂时不使用事务性操作，先用{@link DatabaseUtil.execute}
   */
  static async beginTransaction() {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  /**
   * 提交事务
   * @param {Object} connection - 数据库连接对象
   * @deprecated 暂时不使用事务性操作，先用{@link DatabaseUtil.execute}
   */
  static async commit(connection) {
    try {
      await connection.commit();
    } finally {
      connection.release();
    }
  }

  /**
   * 回滚事务
   * @param {Object} connection - 数据库连接对象
   * @deprecated 暂时不使用事务性操作，先用{@link DatabaseUtil.execute}
   */
  static async rollback(connection) {
    try {
      await connection.rollback();
    } finally {
      connection.release();
    }
  }

  /**
   * 执行更新操作
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数
   * @returns {Promise}
   */
  static async execute(sql, params = []) {
    let connection;
    try {
      connection = await pool.getConnection();    
      //  async/await 是 JavaScript 中用于处理异步操作的语法糖，它让异步代码写起来像同步代码一样清晰
      // await 的作用是等待 Promise 解决，并返回结果。
      const [results] = await connection.execute(sql, params);
      // connection.execute 是使用参数化查询，因此不需要对参数进行转义，也不用担心SQL注入攻击
      logger.debug('执行了execute操作}',results);
      return results;
    } catch (error) {
      console.error('数据库执行错误:', error);
      logger.error('数据库执行错误:', error);
      throw error;
    } finally {
      if (connection) connection.release();
      // 保证释放连接
    }
  }

  /**
   * 测试数据库连接
   */
  static async testConnection() {
    try {
      const connection = await pool.getConnection();
      await connection.ping();    // 测试连接
      connection.release();
      logger.info('数据库连接成功');
      return true;
    } catch (error) {
      console.error('数据库连接失败:', error);
      logger.error('数据库连接失败:', error);
      return false;
    }
  }
  
  /**
   * 初始化默认管理员用户
   * @returns {Promise<boolean>} 是否创建了管理员用户
   */
  static async initializeAdminUser() {
    try {
      // 检查用户表是否为空
      const countResult = await this.execute('SELECT COUNT(*) as count FROM users');
      const userCount = countResult[0].count;
      
      if (userCount === 0) {
        // 表为空，创建默认管理员用户
        const hashedPassword = await bcrypt.hash('root', parseInt(config.bcrypt.saltRounds));
        
        await this.execute(
          'INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
          ['admin', hashedPassword, 'Administrator_default', 1, 1]
        );
        
        logger.info('默认管理员用户已创建 - 用户名: admin, 密码: root');
        return true;
      } else {
        logger.info(`用户表已有 ${userCount} 个用户，跳过初始化管理员账户`);
        return false;
      }
    } catch (error) {
      console.error('初始化管理员用户失败:', error);
      logger.error('初始化管理员用户失败:', error);
      return false;
    }
  }
}

module.exports = DatabaseUtil;