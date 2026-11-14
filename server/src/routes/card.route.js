import { Router } from 'express';
import { getAllCards, getCardByCode } from '../controllers/card.controller.js';

const router = Router();

router.get('/', getAllCards);
router.get('/:code', getCardByCode);

export default router;