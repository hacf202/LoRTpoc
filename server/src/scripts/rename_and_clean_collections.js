import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'guidePoc';
const DATA_DIR = path.join(__dirname, '../data');

// Clean, concise collection mappings
const CLEAN_COLLECTION_MAP = [
  { file: 'champions.json', newName: 'champions', oldName: 'guidePocChampionList' },
  { file: 'constellations.json', newName: 'constellations', oldName: 'guidePocChampionConstellation' },
  { file: 'relics.json', newName: 'relics', oldName: 'guidePocRelics' },
  { file: 'powers.json', newName: 'powers', oldName: 'guidePocPowers' },
  { file: 'items.json', newName: 'items', oldName: 'guidePocItems' },
  { file: 'cards.json', newName: 'cards', oldName: 'guidePocCardList' },
  { file: 'maps.json', newName: 'maps', oldName: 'guidePocAdventureMap' },
  { file: 'bosses.json', newName: 'bosses', oldName: 'guidePocBosses' },
  { file: 'subChampions.json', newName: 'subChampions', oldName: 'guidePocSubChampions' },
  { file: 'runes.json', newName: 'runes', oldName: 'guidePocRunes' },
  { file: 'bonusStars.json', newName: 'bonusStars', oldName: 'guidePocBonusStar' },
  { file: 'builds.json', newName: 'builds', oldName: 'guidePocBuilds' },
];

async function run() {
  console.log('====================================================');
  console.log('🔄 RENAMING & CLEANING MONGODB COLLECTIONS');
  console.log('====================================================\n');

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`✅ Connected to [${DB_NAME}]`);

    // 1. Insert data into clean collections
    for (const item of CLEAN_COLLECTION_MAP) {
      const filePath = path.join(DATA_DIR, item.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${item.file}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const docs = JSON.parse(fileContent);

      const targetCol = db.collection(item.newName);
      await targetCol.deleteMany({});

      const batchSize = 500;
      let inserted = 0;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize).map((d) => {
          const copy = { ...d };
          if (copy._id && typeof copy._id === 'object' && copy._id.$oid) {
            delete copy._id;
          }
          return copy;
        });
        const res = await targetCol.insertMany(batch, { ordered: false });
        inserted += res.insertedCount;
      }
      console.log(`✅ Created clean collection [${item.newName}]: ${inserted} documents`);

      // 2. Drop old verbose collection
      try {
        await db.collection(item.oldName).drop();
        console.log(`   🗑️ Dropped old collection: [${item.oldName}]`);
      } catch (err) {
        // If not exists or already dropped, ignore
      }
    }

    // 3. Print final list of collections
    console.log('\n--- FINAL COLLECTIONS LIST IN DATABASE [' + DB_NAME + '] ---');
    const finalCols = await db.listCollections().toArray();
    for (const col of finalCols.sort((a, b) => a.name.localeCompare(b.name))) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  • ${col.name.padEnd(20, ' ')} : ${count} docs`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL COLLECTIONS SUCCESSFULLY RENAMED & CLEANED!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

run();
