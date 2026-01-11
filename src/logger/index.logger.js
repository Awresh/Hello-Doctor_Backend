import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

// Ensure log directory exists
const logDir = process.env.LOG_DIR || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Extracts the caller's file, line, and function from the stack trace.
 * Ignores internal winston/logger calls.
 */
const getCallerInfo = format((info) => {
  // Increase stack trace limit to ensure we find the caller
  const originalLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = 50;

  const obj = {};
  Error.captureStackTrace(obj);
  Error.stackTraceLimit = originalLimit; // Restore limit

  // Parse stack trace
  const stack = obj.stack.split('\n');

  // Find the first line that isn't from node_modules, this logger file, or internal node modules
  let callerLine = stack.find(line =>
    !line.includes('node_modules') &&
    !line.includes('logger/index.logger.js') &&
    !line.includes('Error') &&
    !line.includes('node:')
  );

  if (callerLine) {
    // Extract details using regex
    // Matches: at FunctionName (/path/to/file.js:123:45) or at /path/to/file.js:123:45
    const match = callerLine.match(/at\s+(?:(.+?)\s+\()?(?:.+?\/)?([^/]+?):(\d+):(\d+)\)?/);
    if (match) {
      info.functionName = match[1] || 'anonymous';
      info.fileName = match[2];
      info.lineNumber = match[3];
    }
  }

  return info;
});

/**
 * Custom Log Format for Files
 * Adds timestamp, source location, and stringifies metadata
 */
const fileFormat = format.printf(({ level, message, timestamp, fileName, lineNumber, functionName, ...meta }) => {
  let location = '';
  if (fileName) {
    location = ` [${fileName}:${lineNumber} ${functionName}]`;
  }

  let logMessage = `${timestamp} [${level.toUpperCase()}]${location}: ${message}`;
  if (Object.keys(meta).length > 0) {
    logMessage += ` ${JSON.stringify(meta)}`;
  }
  return logMessage;
});

/**
 * Custom Log Format for Console
 * Adds colors, timestamp, and source location
 */
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ level, message, timestamp, fileName, lineNumber, functionName, ...meta }) => {
    let location = '';
    if (fileName) {
      location = ` \x1b[90m[${fileName}:${lineNumber} ${functionName}]\x1b[0m`; // Gray color for location
    }

    let logMessage = `${timestamp} ${level}${location}: ${message}`;
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    return logMessage;
  })
);

/**
 * Logger Configuration
 * 
 * @description
 * This logger is configured to:
 * 1. Write all logs with level `error` and below to `error-%DATE%.log`
 * 2. Write all logs with level `info` and below to `application-%DATE%.log`
 * 3. Rotate log files daily to prevent large file sizes (max 20MB, keep 14 days).
 * 4. Print colorful logs to the console for development.
 * 5. Track source location (file, line, function) for debugging.
 * 
 * @configuration
 * Controlled via .env variables:
 * - LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' (default: 'info')
 * - LOG_DIR: Directory path (default: 'logs')
 * - LOG_TO_FILE: 'true' | 'false' (default: false)
 * 
 * @usage
 * const logger = require('./src/logger/index.logger');
 * 
 * // Basic Usage
 * logger.info('Server started');
 * logger.error('Database failed', { error: err });
 * 
 * // With Metadata
 * logger.warn('Rate limit exceeded', { ip: '127.0.0.1', count: 50 });
 * 
 * @useCases
 * 1. **Debugging**: Use `logger.debug()` to trace variable values and flow.
 *    Example: `logger.debug('User payload', { body: req.body });`
 * 
 * 2. **Error Tracking**: Use `logger.error()` in catch blocks.
 *    Example: `logger.error('Payment failed', { error: err.message, stack: err.stack });`
 * 
 * 3. **Audit Trails**: Use `logger.info()` for critical business actions.
 *    Example: `logger.info('User deleted', { userId: 123, adminId: 456 });`
 */
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    getCallerInfo(), // Extract caller info first
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // Log the full stack trace on errors
    format.splat(),
    format.json()
  ),
  transports: [
    // Console Transport
    new transports.Console({
      format: consoleFormat,
      handleExceptions: true
    }),
  ],
  exitOnError: false
});

// Add File Transports if enabled
if (process.env.LOG_TO_FILE === 'true') {
  // Error Logs - Daily Rotate
  logger.add(new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: format.combine(
      getCallerInfo(),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      fileFormat
    )
  }));

  // Combined Logs (All levels) - Daily Rotate
  logger.add(new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: format.combine(
      getCallerInfo(),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      fileFormat
    )
  }));
}

export default logger;