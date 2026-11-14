import { Router } from 'express';
import { itemController } from '../controllers/item.controller.js';

const router = Router();

router.get('/', itemController.getAll);
router.get('/:id', itemController.getById);

export default router;
