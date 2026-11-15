import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'guidePoc';
const REDIS_URL = process.env.REDIS_URL;
const DATA_DIR = path.join(__dirname, '../data');

// Collection mapping: [JSON file name] -> [MongoDB Collection name]
const DATA_COLLECTIONS = [
  { file: 'champions.json', collection: 'champions' },
  { file: 'constellations.json', collection: 'constellations' },
  { file: 'relics.json', collection: 'relics' },
  { file: 'powers.json', collection: 'powers' },
  { file: 'items.json', collection: 'items' },
  { file: 'cards.json', collection: 'cards' },
  { file: 'maps.json', collection: 'maps' },
  { file: 'bosses.json', collection: 'bosses' },
  { file: 'subChampions.json', collection: 'subChampions' },
  { file: 'runes.json', collection: 'runes' },
  { file: 'bonusStars.json', collection: 'bonusStars' },
  { file: 'builds.json', collection: 'builds' },
];

async function run() {
  console.log('====================================================');
  console.log('🚀 RESETTING & SYNCING DATABASE FOR THE PATH OF CHAMPIONS V2');
  console.log('====================================================\n');

  // --- 1. Clear Redis Cache ---
  if (REDIS_URL) {
    console.log('🧹 1. Clearing Redis Cache...');
    try {
      const redis = new Redis(REDIS_URL, { connectTimeout: 7000 });
      await redis.ping();
      const keys = await redis.keys('*');
      console.log(`   Found ${keys.length} keys in Redis.`);
      if (keys.length > 0) {
        await redis.flushdb();
        console.log('   ✅ Redis DB flushed successfully.');
      } else {
        console.log('   ✅ Redis was already clean.');
      }
      await redis.quit();
    } catch (err) {
      console.error('   ❌ Redis clear error:', err.message);
    }
  }

  // --- 2. Connect to MongoDB & Clear Old Collections ---
  console.log('\n📦 2. Connecting to MongoDB and updating collections...');
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 120000,
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`   ✅ Connected to database: [${DB_NAME}]`);

    for (const item of DATA_COLLECTIONS) {
      const filePath = path.join(DATA_DIR, item.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`   ⚠️ File not found: ${item.file}, skipping.`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      const docs = Array.isArray(data) ? data : Object.values(data);

      console.log(`\n   --- Processing [${item.collection}] (${docs.length} items from ${item.file}) ---`);

      const collection = db.collection(item.collection);

      // Drop/Clear old collection
      const deleteResult = await collection.deleteMany({});
      console.log(`   🗑️ Cleared ${deleteResult.deletedCount} old documents from ${item.collection}.`);

      // Insert new documents in batches of 500
      if (docs.length > 0) {
        const batchSize = 500;
        let inserted = 0;
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = docs.slice(i, i + batchSize);
          // Remove custom _id if string or duplicate, let mongo handle or preserve unique id
          const sanitizedBatch = batch.map((d) => {
            const copy = { ...d };
            // Ensure no conflicting string _id unless intentional
            if (copy._id && typeof copy._id === 'object' && copy._id.$oid) {
              delete copy._id;
            }
            return copy;
          });
          const insertRes = await collection.insertMany(sanitizedBatch, { ordered: false });
          inserted += insertRes.insertedCount;
        }
        console.log(`   ✅ Successfully inserted ${inserted} documents into ${item.collection}.`);
      }
    }

    console.log('\n====================================================');
    console.log('🎉 ALL COLLECTIONS SUCCESSFULLY RESET & POPULATED WITH V2 DATA!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ MongoDB sync failed:', err);
  } finally {
    await client.close();
  }
}

run();
