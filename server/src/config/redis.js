import Redis from 'ioredis';

let redisClient = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 8000,
      commandTimeout: 5000,
      enableOfflineQueue: true,
      maxOfflineQueueSize: 500,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 300, 2000);
      },
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
      console.log('✅ Redis is authenticated and READY to cache queries.');
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });

    redisClient.on('reconnecting', () => {
      isRedisConnected = false;
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      if (err.code !== 'ECONNREFUSED' && err.code !== 'ENOTFOUND') {
        console.warn('⚠️ Redis connection error:', err.message);
      }
    });
  } catch (err) {
    console.warn('⚠️ Could not initialize Redis client:', err.message);
  }
} else {
  console.log('ℹ️ REDIS_URL not configured. Operating in In-Memory cache mode.');
}

export function isRedisReady() {
  return Boolean(redisClient && redisClient.status === 'ready');
}

export { redisClient, isRedisConnected };
