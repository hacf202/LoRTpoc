import { Router } from 'express';
import { getAllRelics, getRelicByCode } from '../controllers/relic.controller.js';

const router = Router();

router.get('/', getAllRelics);
router.get('/:code', getRelicByCode);

export default router;
