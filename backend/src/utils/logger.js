const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create file transports
const errorLogStream = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });
const allLogStream = fs.createWriteStream(path.join(logsDir, 'all.log'), { flags: 'a' });

const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure Pino with multiple transports
const logger = pino(
  {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  },
  pino.multistream([
    // Console transport with pretty printing in development
    {
      stream: isDevelopment
        ? pino.transport({
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          })
        : process.stdout,
    },
    // Error log transport
    {
      level: 'error',
      stream: errorLogStream,
    },
    // All logs transport
    {
      stream: allLogStream,
    },
  ])
);

module.exports = logger;
