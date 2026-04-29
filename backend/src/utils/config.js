const ini = require('ini');
const path = require('path');
const fs = require('fs');

// 读取配置文件
const configPath = path.resolve(__dirname, '../../..', 'config', 'config.ini');
const config = fs.existsSync(configPath) ? ini.parse(fs.readFileSync(configPath, 'utf-8')) : {};

const applyEnvOverride = (section, key, envKey, transform) => {
	if (!config[section]) config[section] = {};
	if (process.env[envKey] === undefined || process.env[envKey] === null || String(process.env[envKey]).trim() === '') return;
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

const defaultJwtSecret = 'expense_claim_secret_key';

if (process.env.NODE_ENV === 'production') {
	const missingSecureEnvVars = [];
	if (!process.env.DB_PASSWORD) missingSecureEnvVars.push('DB_PASSWORD');
	if (!process.env.JWT_SECRET) missingSecureEnvVars.push('JWT_SECRET');

	if (missingSecureEnvVars.length > 0) {
		throw new Error(`Missing required secure environment variables in production: ${missingSecureEnvVars.join(', ')}`);
	}

	if (config?.jwt?.secret === defaultJwtSecret) {
		throw new Error('Unsafe JWT secret in production. Set JWT_SECRET via environment variable.');
	}
}

module.exports = config;