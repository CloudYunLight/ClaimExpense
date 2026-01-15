const mysql = require('mysql2/promise');
const config = require('ini').parse(require('fs').readFileSync('../config/config.ini', 'utf-8'));

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

module.exports = pool;