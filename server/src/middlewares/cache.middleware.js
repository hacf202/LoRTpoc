import { redisClient, isRedisReady, ensureRedisReady } from '../config/redis.js';

/**
 * High-Performance Distributed Redis + In-Memory Fallback Cache Middleware
 * - Caches computed JSON responses in Redis (L2) with memory fallback (L1)
 * - Auto-invalidates matching entries upon mutations (POST, PUT, PATCH, DELETE)
 * - Bypasses cache for admin requests, explicit no-cache headers, and cache-busting queries
 */

const memoryCache = new Map();
const MAX_MEMORY_ENTRIES = 1000;

function pruneMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
  if (memoryCache.size > MAX_MEMORY_ENTRIES) {
    const toRemove = memoryCache.size - MAX_MEMORY_ENTRIES;
    let count = 0;
    for (const key of memoryCache.keys()) {
      memoryCache.delete(key);
      count++;
      if (count >= toRemove) break;
    }
  }
}

/**
 * Invalidate cache entries by URL prefix or pattern across Redis & Memory
 * @param {string} [prefix] Optional route/path prefix (e.g. '/api/v1/champions')
 */
export async function invalidateServerCache(prefix = null) {
  // 1. Clear Memory Cache
  if (!prefix) {
    memoryCache.clear();
  } else {
    const cleanPrefix = prefix.toLowerCase();
    for (const key of memoryCache.keys()) {
      if (key.toLowerCase().includes(cleanPrefix)) {
        memoryCache.delete(key);
      }
    }
  }

  // 2. Clear Redis Cache
  if (redisClient) {
    try {
      const ready = await ensureRedisReady(2500);
      if (ready) {
        const pattern = prefix ? `poc:cache:*${prefix}*` : 'poc:cache:*';
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to invalidate Redis cache:', err.message);
    }
  }
}

export function clearServerCache() {
  return invalidateServerCache(null);
}

/**
 * HTTP Cache Middleware
 * @param {number} durationSeconds TTL in seconds (default: 60)
 */
export const httpCache = (durationSeconds = 60) => {
  return async (req, res, next) => {
    // 1. Mutation: invalidate matching cache
    if (req.method !== 'GET') {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const basePath = req.baseUrl || req.path;
          if (basePath) {
            invalidateServerCache(basePath);
            if (basePath.includes('/champions')) {
              invalidateServerCache('/search');
              invalidateServerCache('/tierlist');
            }
          }
        }
      });
      return next();
    }

    // 2. Bypass check: Admin token, explicit no-cache, or cache-busting query
    const hasAuth = Boolean(req.headers.authorization || req.cookies?.token || req.headers['x-admin-token']);
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

    const cacheKey = req.originalUrl || req.url;
    const redisKey = `poc:cache:${cacheKey}`;

    // 3. Try Redis Cache
    if (isRedisReady() && redisClient) {
      try {
        const cachedRaw = await redisClient.get(redisKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          res.set({
            'Content-Type': cached.contentType || 'application/json; charset=utf-8',
            'Cache-Control': `public, max-age=${durationSeconds}, stale-while-revalidate=30`,
            'Vary': 'Accept-Encoding, Authorization',
            'X-Server-Cache': 'HIT (Redis)'
          });
          return res.status(cached.statusCode || 200).send(cached.data);
        }
      } catch (err) {
        // Redis read failure: fail-safe to memory
      }
    }

    // 4. Try Memory Cache Fallback
    const memCached = memoryCache.get(cacheKey);
    const now = Date.now();
    if (memCached && memCached.expiresAt > now) {
      res.set({
        'Content-Type': memCached.contentType || 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${durationSeconds}, stale-while-revalidate=30`,
        'Vary': 'Accept-Encoding, Authorization',
        'X-Server-Cache': 'HIT (Memory)'
      });
      return res.status(memCached.statusCode).send(memCached.data);
    }

    // 5. Cache MISS: intercept response
    res.set({
      'Cache-Control': `public, max-age=${durationSeconds}, stale-while-revalidate=30`,
      'Vary': 'Accept-Encoding, Authorization',
      'X-Server-Cache': 'MISS'
    });

    const originalSend = res.send.bind(res);

    res.send = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const payload = {
          data: body,
          contentType: res.get('Content-Type') || 'application/json; charset=utf-8',
          statusCode: res.statusCode
        };

        // Save to Redis if available
        if (isRedisReady() && redisClient) {
          redisClient.setex(redisKey, durationSeconds, JSON.stringify(payload)).catch(() => {});
        }

        // Save to Memory
        if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
          pruneMemoryCache();
        }
        memoryCache.set(cacheKey, {
          ...payload,
          expiresAt: Date.now() + durationSeconds * 1000
        });
      }
      return originalSend(body);
    };

    next();
  };
};
