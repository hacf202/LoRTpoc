import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Configure public DNS to resolve MongoDB SRV records reliably
dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server/.env or project root
const serverEnvPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'guidePoc';

if (!uri) {
  console.error('❌ MONGODB_URI is not set in environment (check server/.env).');
  process.exit(1);
}

// Format timestamp: YYYY-MM-DD_HH-mm-ss
function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${MM}-${dd}_${HH}-${mm}-${ss}`;
}

async function runBackup() {
  const startTime = Date.now();
  const timestamp = getTimestamp();
  const projectRoot = path.resolve(__dirname, '../../');
  const backupBaseDir = path.join(projectRoot, 'backups');
  const targetBackupDir = path.join(backupBaseDir, `backup_${timestamp}`);
  const latestBackupDir = path.join(backupBaseDir, 'latest');
  const serverDataDir = path.join(projectRoot, 'server/src/data');

  fs.mkdirSync(targetBackupDir, { recursive: true });
  fs.mkdirSync(latestBackupDir, { recursive: true });

  console.log('====================================================');
  console.log(`📦 LoR TPoC Database Backup Script`);
  console.log(`📡 Database: ${dbName}`);
  console.log(`📁 Destination: backups/backup_${timestamp}/`);
  console.log('====================================================');

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  });

  try {
    await client.connect();
    console.log(`✅ Connected to MongoDB.`);

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name).sort();

    console.log(`📋 Found ${collectionNames.length} collections. Starting export...\n`);

    const manifest = {
      backupDate: new Date().toISOString(),
      timestamp,
      database: dbName,
      totalCollections: collectionNames.length,
      totalDocuments: 0,
      totalSizeBytes: 0,
      collections: {}
    };

    // Mapping for core server data synchronization
    const coreCollectionsMap = {
      champions: 'champions.json',
      relics: 'relics.json',
      powers: 'powers.json',
      items: 'items.json',
      cards: 'cards.json',
      maps: 'maps.json',
      constellations: 'constellations.json',
      bonusStars: 'bonusStars.json'
    };

    for (const name of collectionNames) {
      process.stdout.write(`  ⏳ Exporting [${name}]... `);
      const docs = await db
        .collection(name)
        .find({}, { projection: { _id: 0 } })
        .toArray();

      const jsonStr = JSON.stringify(docs, null, 2);
      const filePath = path.join(targetBackupDir, `${name}.json`);
      const latestFilePath = path.join(latestBackupDir, `${name}.json`);

      fs.writeFileSync(filePath, jsonStr, 'utf8');
      fs.writeFileSync(latestFilePath, jsonStr, 'utf8');

      // Also sync to server/src/data if it's one of the core 8 collections
      if (coreCollectionsMap[name]) {
        const localDataPath = path.join(serverDataDir, coreCollectionsMap[name]);
        try {
          fs.writeFileSync(localDataPath, jsonStr, 'utf8');
        } catch {
          // ignore if folder not present
        }
      }

      const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');
      const sizeKB = (sizeBytes / 1024).toFixed(1);

      manifest.totalDocuments += docs.length;
      manifest.totalSizeBytes += sizeBytes;
      manifest.collections[name] = {
        documents: docs.length,
        sizeBytes,
        sizeKB: `${sizeKB} KB`
      };

      console.log(`done (${docs.length} docs, ${sizeKB} KB)`);
    }

    // Write _manifest.json
    const manifestJson = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(path.join(targetBackupDir, '_manifest.json'), manifestJson, 'utf8');
    fs.writeFileSync(path.join(latestBackupDir, '_manifest.json'), manifestJson, 'utf8');

    const totalMB = (manifest.totalSizeBytes / (1024 * 1024)).toFixed(2);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n====================================================');
    console.log(`🎉 Backup completed successfully in ${duration}s!`);
    console.log(`📊 Total Collections : ${manifest.totalCollections}`);
    console.log(`📄 Total Documents   : ${manifest.totalDocuments.toLocaleString()}`);
    console.log(`💾 Total Data Size   : ${totalMB} MB`);
    console.log(`📂 Saved to:`);
    console.log(`   - backups/backup_${timestamp}/`);
    console.log(`   - backups/latest/`);
    console.log(`   - server/src/data/ (synchronized core datasets)`);
    console.log('====================================================\n');
  } catch (err) {
    console.error(`\n❌ Backup failed:`, err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runBackup();
