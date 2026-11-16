import { Router } from 'express';
import { httpCache } from '../middlewares/cache.middleware.js';
import authRoutes from './auth.route.js';
import championRoutes from './champion.route.js';
import relicRoutes from './relic.route.js';
import itemRoutes from './item.route.js';
import mapRoutes from './map.route.js';
import powerRoutes from './power.route.js';
import cardRoutes from './card.route.js';
import constellationRoutes from './constellation.route.js';
import bonusStarRoutes from './bonusStar.route.js';
import tierlistRoutes from './tierlist.route.js';
import searchRoutes from './search.route.js';
import seoRoutes from './seo.route.js';

const router = Router();

// 1. Health check & Auth (No cache)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.use('/auth', authRoutes);

// 2. SEO routes under API namespace
router.use('/seo', seoRoutes);

// 3. Cache TTL configuration (Default: 24h for static game collections, 1h for search queries)
const DATA_CACHE_TTL = Number(process.env.DATA_CACHE_TTL) || 86400; // 24 hours (86,400s)
const SEARCH_CACHE_TTL = Number(process.env.SEARCH_CACHE_TTL) || 3600; // 1 hour (3,600s)

// 4. Core LoR PoC Resources with Redis Cache (Automatically invalidated upon admin updates)
router.use('/champions', httpCache(DATA_CACHE_TTL), championRoutes);
router.use('/relics', httpCache(DATA_CACHE_TTL), relicRoutes);
router.use('/items', httpCache(DATA_CACHE_TTL), itemRoutes);
router.use('/maps', httpCache(DATA_CACHE_TTL), mapRoutes);
router.use('/powers', httpCache(DATA_CACHE_TTL), powerRoutes);
router.use('/cards', httpCache(DATA_CACHE_TTL), cardRoutes);
router.use('/constellations', httpCache(DATA_CACHE_TTL), constellationRoutes);
router.use('/bonus-stars', httpCache(DATA_CACHE_TTL), bonusStarRoutes);
router.use('/tierlist', httpCache(DATA_CACHE_TTL), tierlistRoutes);
router.use('/search', httpCache(SEARCH_CACHE_TTL), searchRoutes);

export default router;