import { recordLog } from '../services/systemLog.service.js';
import { getClientIp } from './rateLimit.middleware.js';

/**
 * Intelligent Request Performance & Error Audit Middleware
 * Monitors live HTTP traffic non-intrusively:
 * - Detects slow endpoints (taking > 1000ms) to spotlight backend bottlenecks
 * - Tracks 5xx status codes that bypass the standard error handler
 * - Skips lightweight heartbeat pings to avoid log noise
 */
export function requestAuditMiddleware(req, res, next) {
  const startTime = performance.now();

  res.on('finish', () => {
    // Ignore internal presence heartbeats and healthchecks to keep logs clean
    const originalUrl = req.originalUrl || req.url || '';
    if (originalUrl.includes('/presence/ping') || originalUrl === '/health' || originalUrl === '/api/health') {
      return;
    }

    const durationMs = Math.round(performance.now() - startTime);
    const statusCode = res.statusCode;
    const clientIp = getClientIp(req);
    const method = req.method;
    const cleanPath = (req.baseUrl || '') + (req.path || '');

    // 1. Detect slow queries/endpoints (Duration > 1000ms)
    if (durationMs >= 1000 && statusCode < 400) {
      recordLog({
        key: `perf:slow:${method}:${cleanPath || originalUrl.split('?')[0]}`,
        level: 'warn',
        category: 'performance',
        message: `Slow Request (${durationMs}ms): ${method} ${originalUrl} [HTTP ${statusCode}]`,
        value: {
          method,
          url: originalUrl,
          statusCode,
          durationMs,
          ip: clientIp,
          query: req.query
        }
      });
    }

    // 2. Track 5xx Gateway/Server Errors if not caught by error middleware
    if (statusCode >= 500) {
      recordLog({
        key: `error:${statusCode}:${method}:${cleanPath || originalUrl.split('?')[0]}`,
        level: 'error',
        category: 'api_error',
        message: `HTTP ${statusCode} Server Error: ${method} ${originalUrl} (${durationMs}ms)`,
        value: {
          method,
          url: originalUrl,
          statusCode,
          durationMs,
          ip: clientIp,
          userAgent: req.headers['user-agent'] || '',
          query: req.query
        }
      });
    }
  });

  next();
}
