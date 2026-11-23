import { getDb } from '../config/mongo.js';
import { logger } from '../utils/logger.js';

const COLLECTION_NAME = 'system_logs';
const DEFAULT_RETENTION_DAYS = 30;

let indexesInitialized = false;

/**
 * Ensure compound & TTL indexes exist on system_logs collection
 */
async function ensureLogIndexes(collection) {
  if (indexesInitialized) return;
  try {
    await collection.createIndex({ key: 1, createdAt: -1 });
    await collection.createIndex({ level: 1, createdAt: -1 });
    await collection.createIndex({ category: 1, createdAt: -1 });
    await collection.createIndex({ createdAt: -1 });
    // TTL Index: automatically delete logs after expireAt date
    await collection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
    indexesInitialized = true;
  } catch (err) {
    // Non-fatal if index creation fails or already exists
    indexesInitialized = true;
  }
}

/**
 * Mask sensitive keys from value dictionary
 */
function sanitizeValue(value) {
  if (!value || typeof value !== 'object') return value;
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'cookie', 'accesstoken'];

  try {
    const copy = JSON.parse(JSON.stringify(value));
    const mask = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      for (const k of Object.keys(obj)) {
        if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
          obj[k] = '[HIDDEN]';
        } else if (typeof obj[k] === 'object') {
          mask(obj[k]);
        }
      }
    };
    mask(copy);
    return copy;
  } catch {
    return value;
  }
}

/**
 * Record a structured Key-Value Log entry
 * @param {Object} params
 * @param {string} params.key - Categorical or route key (e.g. "error:500:GET:/api/v1/champions", "auth:login:failed")
 * @param {Object} [params.value={}] - Key-Value metadata payload (method, status, error stack, params, headers, etc.)
 * @param {'error'|'warn'|'info'|'http'|'debug'} [params.level='info'] - Log level
 * @param {string} [params.category='system'] - Functional category (api_error, auth, db, system, security)
 * @param {string} [params.message=''] - Human-readable summary message
 * @param {number} [params.retentionDays=30] - Retention period in days before automatic TTL deletion
 */
export async function recordLog({
  key,
  value = {},
  level = 'info',
  category = 'system',
  message = '',
  retentionDays = DEFAULT_RETENTION_DAYS
}) {
  const now = new Date();
  const expireAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  const cleanKey = key || `log:${level}:${Date.now()}`;
  const cleanMessage = message || cleanKey;
  const sanitizedValue = sanitizeValue(value);

  const logDoc = {
    key: cleanKey,
    level,
    category,
    message: cleanMessage,
    value: sanitizedValue,
    createdAt: now,
    expireAt
  };

  // 1. Always log to winston/console/ring-buffer for real-time visibility
  if (level === 'error') {
    logger.error(`[${cleanKey}] ${cleanMessage}`, { key: cleanKey, meta: sanitizedValue });
  } else if (level === 'warn') {
    logger.warn(`[${cleanKey}] ${cleanMessage}`, { key: cleanKey, meta: sanitizedValue });
  } else {
    logger.info(`[${cleanKey}] ${cleanMessage}`, { key: cleanKey, meta: sanitizedValue });
  }

  // 2. Persist to MongoDB system_logs asynchronously (fire-and-forget, non-blocking)
  setImmediate(async () => {
    try {
      const db = getDb();
      if (!db) return;
      const col = db.collection(COLLECTION_NAME);
      await ensureLogIndexes(col);
      await col.insertOne(logDoc);
    } catch (dbErr) {
      // Never crash or block execution if log writing fails
      console.warn('⚠️ [SystemLog] Failed to persist log entry to MongoDB:', dbErr.message);
    }
  });

  return logDoc;
}

/**
 * Query persistent Key-Value logs with filtering and pagination
 * @param {Object} options
 * @param {string} [options.key] - Filter by exact key or prefix
 * @param {string} [options.level] - Filter by log level
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.search] - Search text inside key, message, or value
 * @param {number} [options.limit=100] - Items per page
 * @param {number} [options.page=1] - Page number
 */
export async function querySystemLogs({
  key,
  level,
  category,
  search,
  limit = 100,
  page = 1
} = {}) {
  const safeLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (safePage - 1) * safeLimit;

  try {
    const db = getDb();
    if (!db) {
      // Fallback to in-memory logger ring buffer if DB is offline
      const { getRecentLogs } = await import('../utils/logger.js');
      const memoryLogs = getRecentLogs(safeLimit);
      return {
        total: memoryLogs.length,
        page: 1,
        totalPages: 1,
        source: 'memory',
        data: memoryLogs.map((l) => ({
          id: l.id,
          key: l.meta?.key || `memory:${l.level}`,
          level: l.level,
          category: 'system',
          message: l.message,
          value: l.meta || {},
          timestamp: l.timestamp,
          createdAt: new Date()
        }))
      };
    }

    const col = db.collection(COLLECTION_NAME);
    if (!indexesInitialized) {
      await ensureLogIndexes(col);
    }
    const filter = {};

    if (key) {
      // Search prefix or exact key
      filter.key = { $regex: key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    if (level && level !== 'all') {
      filter.level = level;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search) {
      const searchRegex = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      filter.$or = [
        { key: searchRegex },
        { message: searchRegex },
        { 'value.url': searchRegex },
        { 'value.error.message': searchRegex }
      ];
    }

    const hasFilter = Object.keys(filter).length > 0;
    const countPromise = hasFilter
      ? col.countDocuments(filter)
      : col.estimatedDocumentCount();

    const [total, docs] = await Promise.all([
      countPromise,
      col
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .toArray()
    ]);

    const formattedData = docs.map((doc) => ({
      id: doc._id.toString(),
      key: doc.key,
      level: doc.level,
      category: doc.category || 'system',
      message: doc.message,
      value: doc.value || {},
      timestamp: doc.createdAt
        ? new Date(doc.createdAt).toISOString().replace('T', ' ').slice(0, 19)
        : '',
      createdAt: doc.createdAt
    }));

    return {
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit) || 1,
      source: 'mongodb',
      data: formattedData
    };
  } catch (err) {
    console.error('❌ [SystemLog] Query logs failed:', err.message);
    const { getRecentLogs } = await import('../utils/logger.js');
    const memoryLogs = getRecentLogs(safeLimit);
    return {
      total: memoryLogs.length,
      page: 1,
      totalPages: 1,
      source: 'memory_fallback',
      data: memoryLogs
    };
  }
}

/**
 * Purge all system logs from MongoDB and in-memory buffer
 */
export async function clearAllSystemLogs() {
  const { clearRecentLogs } = await import('../utils/logger.js');
  clearRecentLogs();

  try {
    const db = getDb();
    if (db) {
      await db.collection(COLLECTION_NAME).deleteMany({});
    }
    return true;
  } catch (err) {
    console.error('❌ [SystemLog] Clear logs failed:', err.message);
    return false;
  }
}
