import { recordLog } from '../services/systemLog.service.js';
import { getClientIp } from './rateLimit.middleware.js';

export const notFoundHandler = (req, res, next) => {
  const url = req.originalUrl || req.url || '';
  const method = req.method;

  // Only record API 404s to avoid polluting logs with static asset queries
  if (url.startsWith('/api/') || url.startsWith('/v1/')) {
    const clientIp = getClientIp(req);
    const cleanPath = (req.baseUrl || '') + (req.path || '');

    recordLog({
      key: `error:404:${method}:${cleanPath || url.split('?')[0]}`,
      level: 'warn',
      category: 'api_error',
      message: `404 Not Found: ${method} ${url}`,
      value: {
        method,
        url,
        ip: clientIp,
        userAgent: req.headers['user-agent'] || '',
        query: req.query
      }
    });
  }

  res.status(404).json({
    success: false,
    message: `Not Found - ${url}`
  });
};
