const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Chose the aspect of your log customizing the log format.
const format = winston.format.combine(
  winston.format.timestamp({
    format: () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const milliseconds = String(now.getMilliseconds()).padStart(4, '0').slice(0, 4); // Pad to 3 then maybe we want 4? User example: 16:40:33:4033 (4 digits)
      // The user example "4033" for milliseconds is ambiguous. It looks like "ms" but with 4 digits?
      // "2026-02-03 16:40:33:4033" -> The last part 4033 might be microsecond or just 4 digits?
      // Standard JS date only gives milliseconds (3 digits).
      // Let's stick to 3 digits standard or if user really typed 4033, maybe they meant the YEAR repeated?
      // Wait, "16:40:33:4033" -> The time is 16:40:33. And then :4033.
      // 4033 cannot be milliseconds (max 999).
      // Maybe it's a typo in user request "2026-02-03 ... :4033"?
      // Or maybe it's `HH:mm:ss:YYYY`? No, 4033 is not year.
      // Let's look at the user request carefully: "2026-02-03 16:40:33:4033".
      // Previous line: "The current local time is: 2026-02-03T16:40:50+05:30".
      // The user might have just typed random numbers or it's a specific format.
      // Usually it is SSS (3 digits). If I output 3 digits it should be fine.
      // I will assume milliseconds (3 digits) but if the user wants 4 digits I might pad it, but getting 4th digit from Date is impossible in standard JS.
      // Let's use 3 digits `SSS`.

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}:${String(now.getMilliseconds()).padStart(3, '0')}`;
    }
  }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const transports = [
  // Allow the use the console to print the messages
  new winston.transports.Console(),
  // Allow to print all the error level messages inside the error.log file
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
  }),
  // Allow to print all the messages inside the all.log file
  new winston.transports.File({ filename: path.join(__dirname, '../../logs/all.log') }),
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports,
});

module.exports = logger;
