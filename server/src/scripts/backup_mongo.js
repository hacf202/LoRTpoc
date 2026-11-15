import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = "mongodb+srv://hacf202:Ha01689662141@cluster.fmsdlj2.mongodb.net/?appName=Cluster";
const DB_NAME = "guidePoc";
const BACKUP_DIR = path.join(__dirname, '../data/backup_mongo');

async function backup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log(`Connected to MongoDB. Backing up database [${DB_NAME}] to ${BACKUP_DIR}...`);

  const db = client.db(DB_NAME);
  const collections = await db.listCollections().toArray();

  for (const col of collections) {
    const name = col.name;
    const docs = await db.collection(name).find({}).toArray();
    const filePath = path.join(BACKUP_DIR, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    console.log(`Saved ${name}: ${docs.length} documents.`);
  }

  await client.close();
  console.log("Backup completed successfully!");
}

backup().catch(console.error);
