import { Router } from 'express';
import {
  getAllChampions,
  getChampionById,
  getChampionFilters,
  createChampion,
  updateChampion,
  deleteChampion
} from '../controllers/champion.controller.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Filter options metadata
router.get('/filters', getChampionFilters);

router.route('/')
  .get(getAllChampions)
  .post(requireAdmin, createChampion);

router.route('/:id')
  .get(getChampionById)
  .put(requireAdmin, updateChampion)
  .delete(requireAdmin, deleteChampion);

export default router;
