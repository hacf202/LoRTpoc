import express from 'express';
import cors from 'cors';
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
import { ensureDatabaseConnected } from './config/dbDataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../../client/dist');
const rootDistPath = path.join(__dirname, '../../dist');

const app = express();

// Dynamic Multi-Origin CORS (supports Localhost, lortpoc.com, and Vercel preview domains)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://lortpoc.com',
  'https://www.lortpoc.com'
];
if (config.clientUrl && !allowedOrigins.includes(config.clientUrl)) {
  allowedOrigins.push(config.clientUrl);
}

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép Same-Origin, Server-to-Server, mobile apps hoặc cURL (origin is undefined)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.lortpoc.com') ||
      origin === 'https://lortpoc.com' ||
      origin === 'https://www.lortpoc.com'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
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

// Health check endpoints for Render, monitoring & uptime bots
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

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
