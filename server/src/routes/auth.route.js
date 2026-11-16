import { Router } from 'express';
import {
  loginAdmin,
  verifyCurrentAdmin,
  getSystemLogs,
  deleteSystemLogs
} from '../controllers/auth.controller.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.post('/login', authRateLimiter, loginAdmin);
router.get('/verify', verifyCurrentAdmin);
router.get('/logs', requireAdmin, getSystemLogs);
router.delete('/logs', requireAdmin, deleteSystemLogs);

export default router;
