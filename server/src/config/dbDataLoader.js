import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './mongo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

/**
 * Load a dataset primarily from MongoDB collection.
 * Falls back seamlessly to local JSON backup if MongoDB is unavailable or collection is empty.
 *
 * @param {string} collectionName - MongoDB collection name (e.g. 'champions', 'relics')
 * @param {string} fallbackFileName - Local JSON backup file name (e.g. 'champions.json')
 * @returns {Promise<Array>}
 */
export async function loadCollectionFromDb(collectionName, fallbackFileName) {
  const db = getDb();
  if (db) {
    try {
      const docs = await db
        .collection(collectionName)
        .find({}, { projection: { _id: 0 } })
        .toArray();

      if (Array.isArray(docs) && docs.length > 0) {
        return docs;
      }
    } catch (err) {
      console.warn(`⚠️ [MongoDB] Query failed for [${collectionName}]: ${err.message}. Falling back to file.`);
    }
  }

  // Fallback to local JSON file
  try {
    const fullPath = path.join(dataDir, fallbackFileName);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`❌ [FileFallback] Failed to read ${fallbackFileName}:`, err.message);
  }

  return [];
}

/**
 * Upsert a single document into MongoDB collection
 */
export async function upsertDbDocument(collectionName, filter, doc) {
  const db = getDb();
  if (!db) return false;
  try {
    const { _id, ...cleanDoc } = doc;
    await db.collection(collectionName).replaceOne(filter, cleanDoc, { upsert: true });
    return true;
  } catch (err) {
    console.error(`❌ [MongoDB] Upsert failed for [${collectionName}]:`, err.message);
    return false;
  }
}

/**
 * Delete a single document from MongoDB collection
 */
export async function deleteDbDocument(collectionName, filter) {
  const db = getDb();
  if (!db) return false;
  try {
    await db.collection(collectionName).deleteOne(filter);
    return true;
  } catch (err) {
    console.error(`❌ [MongoDB] Delete failed for [${collectionName}]:`, err.message);
    return false;
  }
}

/**
 * Orchestrate loading all datasets directly from MongoDB collections on server startup
 */
export async function initAllDataFromDatabase() {
  const { championService } = await import('../services/champion.service.js');
  const { relicService } = await import('../services/relic.service.js');
  const { powerService } = await import('../services/power.service.js');
  const { itemService } = await import('../services/item.service.js');
  const { cardService } = await import('../services/card.service.js');
  const { mapService } = await import('../services/map.service.js');
  const { constellationService } = await import('../services/constellation.service.js');
  const { bonusStarService } = await import('../services/bonusStar.service.js');
  const { relationService } = await import('../services/relation.service.js');
  const { clearServerCache } = await import('../middlewares/cache.middleware.js');

  console.log('🔄 [Database Sync] Initializing live datasets from MongoDB...');

  const [champions, relics, powers, items, cards, maps, constellations, bonusStars] = await Promise.all([
    championService.loadFromDb(),
    relicService.loadFromDb(),
    powerService.loadFromDb(),
    itemService.loadFromDb(),
    cardService.loadFromDb(),
    mapService.loadFromDb(),
    constellationService.loadFromDb(),
    bonusStarService.loadFromDb(),
  ]);

  await relationService.rebuild({
    champions,
    relics,
    powers,
    items,
    cards
  });

  await clearServerCache();
  console.log('✅ [Database Sync] All collections successfully queried from MongoDB and indexed into memory & Redis!');
}

let isInitialized = false;
let initPromise = null;

/**
 * Ensures MongoDB is connected and live data is loaded into memory.
 * Safe for both Serverless (Vercel) cold starts and long-running local servers.
 */
export async function ensureDatabaseConnected() {
  if (isInitialized) return true;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const { connectToMongoDB } = await import('./mongo.js');
        const db = await connectToMongoDB();
        if (db) {
          await initAllDataFromDatabase();
        }
      } catch (err) {
        console.warn('⚠️ [Database Sync] Connection error, running with fallback:', err.message);
      } finally {
        isInitialized = true;
      }
    })();
  }
  return initPromise;
}
