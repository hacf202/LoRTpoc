import app from '../server/src/app.js';
import { ensureDatabaseConnected } from '../server/src/config/dbDataLoader.js';

export default async function handler(req, res) {
  // Ensure MongoDB is connected and datasets loaded on Vercel serverless cold-starts
  await ensureDatabaseConnected();

  // When Vercel rewrites /api/(.*) to /api, preserve the original requested URL
  const originalUrl = req.headers['x-matched-path'] || req.url;
  if (originalUrl && (originalUrl.startsWith('/api') || originalUrl.startsWith('/v1'))) {
    req.url = originalUrl;
  }
  return app(req, res);
}
