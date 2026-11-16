import app from '../server/src/app.js';
import { ensureDatabaseConnected } from '../server/src/config/dbDataLoader.js';

export default async function handler(req, res) {
  // Ensure MongoDB is connected and datasets loaded on Vercel serverless cold-starts
  await ensureDatabaseConnected();

  // When Vercel rewrites requests to /api, preserve the original requested URL
  const originalUrl = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.url;
  if (originalUrl) {
    req.url = originalUrl;
  }
  return app(req, res);
}
