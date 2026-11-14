import { Router } from 'express';
import { getTierList } from '../controllers/tierlist.controller.js';

const router = Router();

router.get('/', getTierList);

export default router;