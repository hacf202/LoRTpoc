/**
 * HTTP Cache-Control Middleware
 * Caches public static game data while strictly bypassing cache for:
 * - Authenticated admin requests (Authorization header or token cookie)
 * - Explicit no-cache requests (Cache-Control or Pragma header)
 * - Cache-busting queries (_t, nocache, refresh)
 */
export const httpCache = (durationSeconds = 60) => {
  return (req, res, next) => {
    // 1. Bypass cache for any authenticated or explicit no-cache request
    const hasAuth = Boolean(req.headers.authorization || req.cookies?.token);
    const isNoCache =
      req.headers['cache-control']?.includes('no-cache') ||
      req.headers['pragma'] === 'no-cache';
    const hasCacheBuster = Boolean(req.query._t || req.query.nocache || req.query.refresh);

    if (hasAuth || isNoCache || hasCacheBuster) {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      return next();
    }

    // 2. Only cache safe public GET requests
    if (req.method === 'GET') {
      res.set({
        'Cache-Control': `public, max-age=${durationSeconds}, stale-while-revalidate=30`,
        'Vary': 'Accept-Encoding, Authorization'
      });
    }
    next();
  };
};