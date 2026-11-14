import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';

const router = Router();

router.get('/omni', searchController.omniSearch);
router.get('/', searchController.omniSearch);

export default router;
