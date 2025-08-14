import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

/**
 * Creates a Winston logger instance with structured logging
 * Includes file rotation, console output, and correlation ID support
 */
export function createLogger() {
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    })
  );

  const transports: winston.transport[] = [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ];

  // File transports for production
  if (process.env.NODE_ENV === 'production') {
    // Error log file
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
      })
    );

    // Combined log file
    transports.push(
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false,
  });
}