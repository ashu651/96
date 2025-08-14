"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
function createLogger() {
    const logFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta,
        });
    }));
    const transports = [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
    ];
    if (process.env.NODE_ENV === 'production') {
        transports.push(new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat,
        }));
        transports.push(new DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat,
        }));
    }
    return winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: logFormat,
        transports,
        exitOnError: false,
    });
}
//# sourceMappingURL=logger.js.map