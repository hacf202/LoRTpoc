import { redisClient, isRedisReady } from '../config/redis.js';
import { config } from '../config/env.js';
import { recordLog } from '../services/systemLog.service.js';

/**
 * Intelligent Rate Limiter & Anti-Spam Middleware
 * Supports Distributed Redis (L2) with automatic In-Memory Sliding Window fallback (L1).
 * Accurately extracts real client IPs behind Cloudflare and reverse proxies.
 */

// In-Memory Sliding Window Store (L1 Fallback)
const memoryStore = new Map();
const MAX_MEMORY_CLIENTS = 5000;

function pruneMemoryStore(windowMs) {
  const now = Date.now();
  for (const [key, timestamps] of memoryStore.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, valid);
    }
  }

  // Safety valve against memory bloat
  if (memoryStore.size > MAX_MEMORY_CLIENTS) {
    const toDelete = memoryStore.size - MAX_MEMORY_CLIENTS;
    let count = 0;
    for (const key of memoryStore.keys()) {
      memoryStore.delete(key);
      count++;
      if (count >= toDelete) break;
    }
  }
}

/**
 * Extract real client IP taking into account Cloudflare, reverse proxies, and local connections
 */
export function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp.trim();

  const realIp = req.headers['x-real-ip'];
  if (realIp) return realIp.trim();

  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const rawIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  // Normalize IPv6 localhost
  if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') return '127.0.0.1';
  return rawIp;
}

/**
 * Create a rate limiter middleware
 * @param {Object} options
 * @param {number} [options.windowMs=60000] Time window in milliseconds
 * @param {number} [options.max=120] Max requests per window
 * @param {string} [options.scope='api'] Scope identifier for Redis/Memory key
 * @param {string} [options.message='Too Many Requests'] Custom error message
 */
export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 120;
  const scope = options.scope || 'api';
  const customMessage =
    options.message || 'Bạn đang gửi yêu cầu quá nhanh, vui lòng thử lại sau giây lát.';

  return async (req, res, next) => {
    // 1. Skip OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    const clientIp = getClientIp(req);
    const now = Date.now();
    const windowSeconds = Math.ceil(windowMs / 1000);

    // 2. Try Redis Sliding Window for sensitive scopes (auth) and state-mutating requests (POST, PUT, DELETE)
    // For high-frequency public GET requests, In-Memory Sliding Window executes in < 0.01ms without WAN roundtrip latency.
    const shouldCheckRedis = (scope === 'auth' || req.method !== 'GET') && isRedisReady() && redisClient;
    if (shouldCheckRedis) {
      try {
        const redisKey = `poc:ratelimit:${scope}:${clientIp}`;
        const minScore = now - windowMs;

        // Atomic pipeline: remove expired, add current, count elements, set TTL
        const pipeline = redisClient.pipeline();
        pipeline.zremrangebyscore(redisKey, 0, minScore);
        pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
        pipeline.zcard(redisKey);
        pipeline.expire(redisKey, windowSeconds);

        const results = await pipeline.exec();
        // results[2] is [err, currentCount] from zcard
        const currentCount = results?.[2]?.[1] || 1;

        const remaining = Math.max(0, max - currentCount);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

        if (currentCount > max) {
          const retryAfter = windowSeconds;
          res.setHeader('Retry-After', retryAfter);

          // Asynchronously record rate limit breach
          recordLog({
            key: `security:ratelimit:blocked:${scope}:${clientIp}`,
            level: 'warn',
            category: 'security',
            message: `Rate limit [${scope}] breached by IP ${clientIp} (${currentCount}/${max})`,
            value: { ip: clientIp, scope, currentCount, max, method: req.method, url: req.originalUrl || req.url }
          });

          return res.status(429).json({
            success: false,
            message: customMessage,
            retryAfter
          });
        }

        return next();
      } catch (redisErr) {
        // Fall back gracefully to in-memory sliding window on Redis timeout/error
      }
    }

    // 3. Fallback: In-Memory Sliding Window
    const memKey = `${scope}:${clientIp}`;
    let timestamps = memoryStore.get(memKey) || [];

    // Filter out timestamps outside the active window
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      const oldest = timestamps[0];
      const retryAfter = Math.ceil((oldest + windowMs - now) / 1000) || 1;

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((oldest + windowMs) / 1000));
      res.setHeader('Retry-After', retryAfter);

      // Asynchronously record rate limit breach in memory mode
      recordLog({
        key: `security:ratelimit:blocked:${scope}:${clientIp}`,
        level: 'warn',
        category: 'security',
        message: `Rate limit [${scope}] breached by IP ${clientIp} (${timestamps.length}/${max})`,
        value: { ip: clientIp, scope, currentCount: timestamps.length, max, method: req.method, url: req.originalUrl || req.url }
      });

      return res.status(429).json({
        success: false,
        message: customMessage,
        retryAfter
      });
    }

    // Add current timestamp and store
    timestamps.push(now);
    memoryStore.set(memKey, timestamps);

    // Periodically prune stale entries
    if (memoryStore.size > 200 && Math.random() < 0.05) {
      pruneMemoryStore(windowMs);
    }

    const remaining = Math.max(0, max - timestamps.length);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    next();
  };
}

// Pre-configured Rate Limiters:
// 1. General Public API: 120 requests / 1 minute (Generous for human browsing, blocks brute scrapers)
export const apiRateLimiter = createRateLimiter({
  windowMs: config.rateLimit?.windowMs || 60 * 1000,
  max: config.rateLimit?.maxRequests || 120,
  scope: 'api',
  message: 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng thử lại sau.'
});

// 2. Strict Auth / Login Limiter: 10 attempts / 1 minute (Prevents credential brute-forcing)
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: config.rateLimit?.authMaxRequests || 10,
  scope: 'auth',
  message: 'Quá nhiều lần thử đăng nhập thất bại. Vui lòng đợi 1 phút trước khi thử lại.'
});

// 3. Burst Protection: 25 requests / 2 seconds (Prevents rapid-fire bot flooding)
export const burstRateLimiter = createRateLimiter({
  windowMs: 2000,
  max: 25,
  scope: 'burst',
  message: 'Phát hiện lưu lượng truy cập bất thường. Vui lòng giảm tần suất gửi yêu cầu.'
});
