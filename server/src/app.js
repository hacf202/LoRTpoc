import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import apiRouter from './routes/index.js';
import { seoController } from './controllers/seo.controller.js';
import { socialCrawlerMiddleware } from './middlewares/socialCrawler.middleware.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

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

// HTTP Request Logger piped through Winston
app.use(
  morgan(':method :url :status :response-time ms - :res[content-length]', {
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

// API Routes (mounted at both /api/v1 and /v1 for resilient serverless & reverse-proxy routing)
app.use('/api/v1', apiRouter);
app.use('/v1', apiRouter);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
