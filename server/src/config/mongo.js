import { MongoClient, ServerApiVersion } from 'mongodb';
import dns from 'dns';

// Sử dụng Google DNS để tránh lỗi querySrv ECONNREFUSED từ một số ISP
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'guidePoc';

let client = null;
let db = null;
let connectionPromise = null;

export async function connectToMongoDB() {
  if (db) return db;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set in environment. Running without MongoDB.');
    return null;
  }

  if (!connectionPromise) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 50,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 120000,
    });

    connectionPromise = client
      .connect()
      .then(() => {
        db = client.db(dbName);
        console.log(`✅ MongoDB connected successfully to database: [${dbName}]`);
        return db;
      })
      .catch((err) => {
        connectionPromise = null;
        console.error('❌ MongoDB connection error:', err.message);
        return null;
      });
  }

  return connectionPromise;
}

export function getDb() {
  return db;
}

export { client };
