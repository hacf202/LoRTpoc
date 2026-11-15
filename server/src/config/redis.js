import Redis from 'ioredis';

let redisClient = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      commandTimeout: 3000,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('✅ Redis connected successfully via REDIS_URL');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      if (err.code !== 'ECONNREFUSED' && err.code !== 'ENOTFOUND') {
        console.warn('⚠️ Redis error:', err.message);
      }
    });
  } catch (err) {
    console.warn('⚠️ Could not initialize Redis client:', err.message);
  }
} else {
  console.log('ℹ️ REDIS_URL not configured. Operating in In-Memory cache mode.');
}

export { redisClient, isRedisConnected };
