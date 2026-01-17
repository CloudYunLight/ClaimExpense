const ini = require('ini');
const path = require('path');

// 读取配置文件
const configPath = path.resolve(__dirname, '../../..//config/config.ini');
const config = ini.parse(require('fs').readFileSync(configPath, 'utf-8'));

module.exports = config;