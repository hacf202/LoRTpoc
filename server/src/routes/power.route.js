import { Router } from 'express';
import { getAllPowers, getPowerByCode } from '../controllers/power.controller.js';

const router = Router();

router.get('/', getAllPowers);
router.get('/:code', getPowerByCode);

export default router;