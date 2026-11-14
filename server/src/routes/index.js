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

// 3. Core LoR PoC Resources with fresh HTTP cache (60s public cache, bypass on auth/no-cache)
router.use('/champions', httpCache(60), championRoutes);
router.use('/relics', httpCache(60), relicRoutes);
router.use('/items', httpCache(60), itemRoutes);
router.use('/maps', httpCache(60), mapRoutes);
router.use('/powers', httpCache(60), powerRoutes);
router.use('/cards', httpCache(60), cardRoutes);
router.use('/constellations', httpCache(60), constellationRoutes);
router.use('/bonus-stars', httpCache(60), bonusStarRoutes);
router.use('/tierlist', httpCache(60), tierlistRoutes);
router.use('/search', searchRoutes);

export default router;