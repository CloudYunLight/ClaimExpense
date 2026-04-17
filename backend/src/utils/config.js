const ini = require('ini');
const path = require('path');
const fs = require('fs');

// 读取配置文件
const configPath = path.resolve(__dirname, '../../..//config/config.ini');
const config = ini.parse(fs.readFileSync(configPath, 'utf-8'));

const applyEnvOverride = (section, key, envKey, transform) => {
	if (!config[section]) config[section] = {};
	if (process.env[envKey] === undefined) return;
	config[section][key] = transform ? transform(process.env[envKey]) : process.env[envKey];
};

applyEnvOverride('server', 'host', 'SERVER_HOST');
applyEnvOverride('server', 'port', 'SERVER_PORT');

applyEnvOverride('database', 'host', 'DB_HOST');
applyEnvOverride('database', 'port', 'DB_PORT');
applyEnvOverride('database', 'username', 'DB_USER');
applyEnvOverride('database', 'password', 'DB_PASSWORD');
applyEnvOverride('database', 'database', 'DB_NAME');
applyEnvOverride('database', 'charset', 'DB_CHARSET');

applyEnvOverride('jwt', 'secret', 'JWT_SECRET');
applyEnvOverride('jwt', 'expiresIn', 'JWT_EXPIRES_IN');

applyEnvOverride('bcrypt', 'saltRounds', 'BCRYPT_SALT_ROUNDS');
applyEnvOverride('log', 'level', 'LOG_LEVEL');

if (process.env.NODE_ENV === 'production' && config?.jwt?.secret === 'expense_claim_secret_key') {
	throw new Error('Unsafe JWT secret in production. Set JWT_SECRET via environment variable.');
}

module.exports = config;