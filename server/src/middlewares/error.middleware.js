import { logger } from '../utils/logger.js';
import { recordLog } from '../services/systemLog.service.js';
import { getClientIp } from './rateLimit.middleware.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const method = req.method || 'UNKNOWN';
  const url = req.originalUrl || req.url || '';
  const cleanPath = (req.baseUrl || '') + (req.path || '');
  const errorKey = `error:${statusCode}:${method}:${cleanPath || url.split('?')[0]}`;

  // Log structured Key-Value to MongoDB system_logs asynchronously
  recordLog({
    key: errorKey,
    level: statusCode >= 500 ? 'error' : 'warn',
    category: 'api_error',
    message: `${method} ${url} - ${statusCode} - ${err.message}`,
    value: {
      method,
      url,
      statusCode,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      error: {
        name: err.name || 'Error',
        message: err.message,
        stack: err.stack
      },
      params: req.params,
      query: req.query,
      body: req.body
    }
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
