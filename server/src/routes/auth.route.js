import { Router } from 'express';
import {
  loginAdmin,
  verifyCurrentAdmin,
  getSystemLogs,
  deleteSystemLogs
} from '../controllers/auth.controller.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', loginAdmin);
router.get('/verify', verifyCurrentAdmin);
router.get('/logs', requireAdmin, getSystemLogs);
router.delete('/logs', requireAdmin, deleteSystemLogs);

export default router;
