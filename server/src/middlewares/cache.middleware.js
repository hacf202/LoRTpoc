/**
 * High-Performance Server-Side In-Memory Cache + HTTP Cache-Control Middleware
 * - Caches computed JSON payloads in server RAM for O(1) response times (<1ms)
 * - Bypasses cache for authenticated admin requests, explicit no-cache headers, and cache-busting queries
 * - Auto-invalidates matching cache entries when mutations (POST, PUT, PATCH, DELETE) occur
 */

const serverCache = new Map();
const MAX_CACHE_ENTRIES = 1000;

/**
 * Remove expired entries or evict oldest when exceeding max capacity
 */
function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of serverCache.entries()) {
    if (entry.expiresAt <= now) {
      serverCache.delete(key);
    }
  }

  // If still too large, evict oldest entries
  if (serverCache.size > MAX_CACHE_ENTRIES) {
    const toRemove = serverCache.size - MAX_CACHE_ENTRIES;
    let count = 0;
    for (const key of serverCache.keys()) {
      serverCache.delete(key);
      count++;
      if (count >= toRemove) break;
    }
  }
}

// Periodic cleanup every 60 seconds
const pruneInterval = setInterval(pruneCache, 60 * 1000);
if (pruneInterval.unref) {
  pruneInterval.unref();
}

/**
 * Invalidate cache entries by URL prefix or pattern
 * @param {string} [prefix] Optional prefix (e.g. '/api/v1/champions'). If omitted, clears all cache.
 */
export function invalidateServerCache(prefix = null) {
  if (!prefix) {
    serverCache.clear();
    return;
  }
  const cleanPrefix = prefix.toLowerCase();
  for (const key of serverCache.keys()) {
    if (key.toLowerCase().includes(cleanPrefix)) {
      serverCache.delete(key);
    }
  }
}

/**
 * Clear the entire server-side memory cache
 */
export function clearServerCache() {
  serverCache.clear();
}

/**
 * Middleware factory for server in-memory caching and HTTP caching
 * @param {number} durationSeconds TTL in seconds (default: 60)
 */
export const httpCache = (durationSeconds = 60) => {
  return (req, res, next) => {
    // 1. Invalidation on mutations (POST, PUT, PATCH, DELETE)
    if (req.method !== 'GET') {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const basePath = req.baseUrl || req.path;
          if (basePath) {
            invalidateServerCache(basePath);
          }
        }
      });
      return next();
    }

    // 2. Bypass check: Admin token, explicit no-cache, or cache-busting query
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
        'Surrogate-Control': 'no-store',
        'X-Server-Cache': 'BYPASS'
      });
      return next();
    }

    // 3. Cache key & Lookup
    const cacheKey = req.originalUrl || req.url;
    const cached = serverCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      res.set({
        'Content-Type': cached.contentType || 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${durationSeconds}, stale-while-revalidate=30`,
        'Vary': 'Accept-Encoding, Authorization',
        'X-Server-Cache': 'HIT'
      });
      return res.status(cached.statusCode).send(cached.data);
    }

    // 4. Cache MISS: intercept response
    res.set({
      'Cache-Control': `public, max-age=${durationSeconds}, stale-while-revalidate=30`,
      'Vary': 'Accept-Encoding, Authorization',
      'X-Server-Cache': 'MISS'
    });

    const originalSend = res.send.bind(res);

    res.send = (body) => {
      // Only cache successful 2xx responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (serverCache.size >= MAX_CACHE_ENTRIES) {
          pruneCache();
        }
        serverCache.set(cacheKey, {
          data: body,
          contentType: res.get('Content-Type') || 'application/json; charset=utf-8',
          statusCode: res.statusCode,
          expiresAt: Date.now() + durationSeconds * 1000
        });
      }
      return originalSend(body);
    };

    next();
  };
};
