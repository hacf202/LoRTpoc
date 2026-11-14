import { Router } from 'express';
import { getAllMaps, getMapById } from '../controllers/map.controller.js';

const router = Router();

router.get('/', getAllMaps);
router.get('/:id', getMapById);

export default router;