import { Router } from 'express';
import { getAllBonusStars, getBonusStarById } from '../controllers/bonusStar.controller.js';

const router = Router();

router.get('/', getAllBonusStars);
router.get('/:id', getBonusStarById);

export default router;
