import { redisClient, isRedisConnected } from '../config/redis.js';

const IN_MEMORY_PRESENCE = new Map();
const PRESENCE_TTL_SECONDS = 60; // 60s inactivity threshold
const REDIS_SET_KEY = 'poc:active_sessions';
const REDIS_KEY_PREFIX = 'poc:presence:';

/**
 * Prune stale entries from in-memory presence map
 */
function pruneMemoryPresence() {
  const now = Date.now();
  const threshold = now - PRESENCE_TTL_SECONDS * 1000;
  for (const [sid, data] of IN_MEMORY_PRESENCE.entries()) {
    if (data.lastSeen < threshold) {
      IN_MEMORY_PRESENCE.delete(sid);
    }
  }
}

// Memory pruning every 30 seconds
setInterval(pruneMemoryPresence, 30000);

export const presenceService = {
  /**
   * Record or refresh heartbeat from a client session
   */
  async recordHeartbeat({ sessionId, page = 'home', lang = 'vi' }) {
    if (!sessionId || typeof sessionId !== 'string') return;

    const cleanSid = sessionId.slice(0, 64);
    const now = Date.now();
    const payload = {
      page: String(page || 'home').slice(0, 32),
      lang: String(lang || 'vi').slice(0, 8),
      lastSeen: now
    };

    // 1. In-memory update
    IN_MEMORY_PRESENCE.set(cleanSid, payload);

    // 2. Redis update if available
    if (isRedisConnected && redisClient) {
      try {
        const pipeline = redisClient.pipeline();
        pipeline.zadd(REDIS_SET_KEY, now, cleanSid);
        pipeline.setex(
          `${REDIS_KEY_PREFIX}${cleanSid}`,
          PRESENCE_TTL_SECONDS + 15,
          JSON.stringify(payload)
        );
        pipeline.zremrangebyscore(REDIS_SET_KEY, 0, now - PRESENCE_TTL_SECONDS * 1000);
        await pipeline.exec();
      } catch (err) {
        // Fail-safe fallback to memory
      }
    }
  },

  /**
   * Remove heartbeat session on unload / tab close
   */
  async removeHeartbeat(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') return;
    const cleanSid = sessionId.slice(0, 64);

    IN_MEMORY_PRESENCE.delete(cleanSid);

    if (isRedisConnected && redisClient) {
      try {
        await Promise.all([
          redisClient.zrem(REDIS_SET_KEY, cleanSid),
          redisClient.del(`${REDIS_KEY_PREFIX}${cleanSid}`)
        ]);
      } catch (err) {
        // Ignore redis cleanup error
      }
    }
  },

  /**
   * Get concurrent active users summary with breakdown
   */
  async getActiveUsersStats() {
    const now = Date.now();
    const threshold = now - PRESENCE_TTL_SECONDS * 1000;

    // 1. Try Redis first
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.zremrangebyscore(REDIS_SET_KEY, 0, threshold);
        const activeIds = await redisClient.zrange(REDIS_SET_KEY, 0, -1);
        const total = activeIds.length;
        const byPage = {};
        const byLang = {};

        if (total > 0) {
          const keys = activeIds.map((id) => `${REDIS_KEY_PREFIX}${id}`);
          const rawEntries = await redisClient.mget(keys);
          rawEntries.forEach((raw) => {
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                const p = parsed.page || 'home';
                const l = parsed.lang || 'vi';
                byPage[p] = (byPage[p] || 0) + 1;
                byLang[l] = (byLang[l] || 0) + 1;
              } catch (_) {}
            }
          });
        }

        return {
          total,
          byPage,
          byLang,
          source: 'redis',
          windowSeconds: PRESENCE_TTL_SECONDS,
          timestamp: new Date().toISOString()
        };
      } catch (err) {
        // Fallback to memory
      }
    }

    // 2. In-memory fallback
    pruneMemoryPresence();
    const byPage = {};
    const byLang = {};
    let total = 0;

    for (const [, data] of IN_MEMORY_PRESENCE.entries()) {
      if (data.lastSeen >= threshold) {
        total++;
        const p = data.page || 'home';
        const l = data.lang || 'vi';
        byPage[p] = (byPage[p] || 0) + 1;
        byLang[l] = (byLang[l] || 0) + 1;
      }
    }

    return {
      total,
      byPage,
      byLang,
      source: 'memory',
      windowSeconds: PRESENCE_TTL_SECONDS,
      timestamp: new Date().toISOString()
    };
  }
};
