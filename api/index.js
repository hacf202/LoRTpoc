import app from '../server/src/app.js';

export default function handler(req, res) {
  // When Vercel rewrites /api/(.*) to /api, preserve the original requested URL
  const originalUrl = req.headers['x-matched-path'] || req.url;
  if (originalUrl && (originalUrl.startsWith('/api') || originalUrl.startsWith('/v1'))) {
    req.url = originalUrl;
  }
  return app(req, res);
}
