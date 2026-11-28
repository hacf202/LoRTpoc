import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import apiRouter from './routes/index.js';
import { seoController } from './controllers/seo.controller.js';
import { socialCrawlerMiddleware } from './middlewares/socialCrawler.middleware.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { burstRateLimiter, apiRateLimiter } from './middlewares/rateLimit.middleware.js';
import { wafMiddleware } from './middlewares/waf.middleware.js';
import { requestAuditMiddleware } from './middlewares/requestAudit.middleware.js';
import { ensureDatabaseConnected } from './config/dbDataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../../client/dist');
const rootDistPath = path.join(__dirname, '../../dist');

const app = express();

// Application WAF: Immediately reject common scanner probes (.env, wp-admin, xmlrpc, etc.)
app.use(wafMiddleware);

// Health check endpoints for Render, monitoring & uptime bots (Instant < 0.2ms response, bypasses DB/heavy sync)
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Non-intrusive Audit Middleware: Tracks slow requests (>1000ms), 5xx server errors & security spikes
app.use(requestAuditMiddleware);

// Gzip/Brotli HTTP Compression: Drastically reduces JSON payloads (champions 2.3MB -> 100KB, ~95% bandwidth reduction)
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Strict Multi-Origin CORS whitelist
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://lortpoc.com',
  'https://www.lortpoc.com',
  'https://lortpoc.pages.dev'
];
if (config.clientUrl && !allowedOrigins.includes(config.clientUrl)) {
  allowedOrigins.push(config.clientUrl);
}

// Strictly allow only verified preview subdomains of this specific project on Cloudflare Pages
const isAllowedPagesPreview = (origin) => {
  return /^https:\/\/[a-z0-9-]+\.lortpoc\.pages\.dev$/.test(origin);
};

// Allow any localhost / 127.0.0.1 port in local development
const isAllowedLocalhost = (origin) => {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow Same-Origin, Server-to-Server, mobile apps, or cURL (origin is undefined)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      isAllowedLocalhost(origin) ||
      origin.endsWith('.lortpoc.com') ||
      isAllowedPagesPreview(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database auto-connection & live dataset sync middleware (Safe for Serverless cold-starts & long-running servers)
app.use(async (req, res, next) => {
  try {
    await ensureDatabaseConnected();
  } catch (err) {
    console.warn('⚠️ [Database Sync] Connection error:', err.message);
  }
  next();
});

// HTTP Request Logger piped through Winston
app.use(
  morgan(':method :url :status :response-time ms - :res[content-length]', {
    skip: (req) => req.url.includes('/presence/ping'),
    stream: {
      write: (message) => logger.http(message.trim())
    }
  })
);

// Bot Crawler Interceptor for rich Discord/Facebook/Twitter previews
app.use(socialCrawlerMiddleware);

// Root-level SEO Endpoints (For Search Engine Crawlers & Social Bots)
app.get('/sitemap.xml', seoController.getSitemap);
app.get('/robots.txt', seoController.getRobots);
app.get('/preview', seoController.getSocialPreview);
app.get('/share', seoController.getSocialPreview);

// API Routes with Rate Limiting & Anti-Spam protection
app.use('/api/v1', burstRateLimiter, apiRateLimiter, apiRouter);
app.use('/v1', burstRateLimiter, apiRateLimiter, apiRouter);

// Serve static client assets if present in distribution
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}
if (fs.existsSync(rootDistPath)) {
  app.use(express.static(rootDistPath));
}

// For all non-API web routes, serve SPA index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/v1')) {
    return next();
  }
  const clientIndex = path.join(clientDistPath, 'index.html');
  const rootIndex = path.join(rootDistPath, 'index.html');
  if (fs.existsSync(clientIndex)) {
    return res.sendFile(clientIndex);
  }
  if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  next();
});

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
