import winston from 'winston';

const LOG_DIR = process.env.LOG_DIR || 'logs';
const level = () => {
	const env = process.env.NODE_ENV || 'development';
	return env === 'development' ? 'debug' : 'info';
}

const format = winston.format.combine(
	winston.format.timestamp(),
	winston.format.printf(info => `${info.timestamp} [${info.service}] ${info.level}: ${info.message}`)
)

const transports = [
	new winston.transports.Console(),
	new winston.transports.File({
		filename: `${LOG_DIR}/error.log`, 
		level: 'error',
		maxsize: 5242880, // 5MB,
		maxFiles: 5,
		tailable: true,
		zippedArchive: true,
		handleExceptions: true,
	 }),
	new winston.transports.File({ 
		filename: `${LOG_DIR}/combined.log`,
		maxFiles: 5,
		maxsize: 5242880, // 5MB,
		tailable: true,
		zippedArchive: true,
		handleExceptions: true,
	})
]

const Logger = winston.createLogger({
	level: level(),

	defaultMeta: { service: 'fms-cs app' },
	format,
	transports
});

export default Logger;
