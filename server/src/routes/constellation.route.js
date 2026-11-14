import { Router } from 'express';
import { getAllConstellations, getConstellationById } from '../controllers/constellation.controller.js';

const router = Router();

router.get('/', getAllConstellations);
router.get('/:id', getConstellationById);

export default router;