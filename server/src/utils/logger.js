import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = !!process.env.VERCEL;

// Ensure logs directory exists (Only in persistent environment, skip on Vercel read-only filesystem)
const logsDir = path.join(__dirname, '../../logs');
if (!isVercel && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// In-Memory Ring Buffer for Web Admin Realtime Viewer (stores last 200 logs)
const MAX_RECENT_LOGS = 200;
const recentLogsBuffer = [];

function addToRecentLogs(level, message, timestamp, meta = null) {
  recentLogsBuffer.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp,
    level,
    message,
    meta
  });
  if (recentLogsBuffer.length > MAX_RECENT_LOGS) {
    recentLogsBuffer.pop();
  }
}

// Custom format for terminal output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'http',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  transports: [
    // 1. Console Transport with colored output
    new winston.transports.Console({
      format: consoleFormat
    }),
    // 2. Combined File Transport (Only non-Vercel environment)
    ...(!isVercel
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 3
          }),
          new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 3
          })
        ]
      : [])
  ]
});

// Hook into logger to also save to recentLogsBuffer
const originalWrite = logger.write;
logger.write = function (info) {
  const ts = info.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19);
  addToRecentLogs(info.level, info.message, ts, info.meta);
  return originalWrite.call(this, info);
};

export const getRecentLogs = (limit = 100) => {
  return recentLogsBuffer.slice(0, limit);
};

export const clearRecentLogs = () => {
  recentLogsBuffer.length = 0;
};
