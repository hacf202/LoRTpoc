import { Router } from 'express';
import { presenceController } from '../controllers/presence.controller.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Public heartbeat endpoints (low-overhead, unauthenticated)
router.post('/ping', presenceController.ping);
router.post('/leave', presenceController.leave);

// Admin-only concurrent users metrics
router.get('/stats', requireAdmin, presenceController.getStats);

export default router;
