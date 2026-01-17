const mysql = require('mysql2');
const config = require('./config');
const logger = require('./logger');

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
      await connection.ping();
      connection.release();
      console.log('数据库连接成功');
      logger.log('数据库连接成功');
      return true;
    } catch (error) {
      console.error('数据库连接失败:', error);
      logger.error('数据库连接失败:', error);
      return false;
    }
  }
}

module.exports = DatabaseUtil;