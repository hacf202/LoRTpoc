import { Router } from 'express';
import { seoController } from '../controllers/seo.controller.js';

const router = Router();

router.get('/sitemap.xml', seoController.getSitemap);
router.get('/robots.txt', seoController.getRobots);
router.get('/preview', seoController.getSocialPreview);

export default router;
