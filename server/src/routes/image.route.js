import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { imageController } from '../controllers/image.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit per file
  }
});

// All image management endpoints require admin authentication
router.use(requireAdmin);

router.get('/folders', imageController.getFolders);
router.post('/folders', imageController.createFolder);
router.delete('/folders/:folderName', imageController.deleteFolder);

router.get('/stats', imageController.getStats);

router.get('/', imageController.getImages);
router.post('/upload', upload.array('images', 20), imageController.uploadImages);
router.put('/update-single', upload.single('image'), imageController.updateSingle);
router.delete('/single', imageController.deleteSingle);

export default router;
