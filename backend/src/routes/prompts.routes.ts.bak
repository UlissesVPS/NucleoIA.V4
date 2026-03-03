import { Router } from 'express';
import {
  listPrompts, getPrompt, createPrompt, updatePrompt, deletePrompt,
  toggleLike, copyPrompt, getMyPrompts, createCommunityPrompt, bulkImportPrompts, downloadImages
} from '../controllers/prompts.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listPrompts);
router.get('/my', getMyPrompts);
router.post('/my', createCommunityPrompt);
router.get('/:id', getPrompt);
router.post('/:id/like', toggleLike);
router.post('/:id/copy', copyPrompt);

// Admin only
router.post('/download-images', adminMiddleware, downloadImages);
router.post('/bulk-import', adminMiddleware, bulkImportPrompts);
router.post('/', adminMiddleware, createPrompt);
router.put('/:id', adminMiddleware, updatePrompt);
router.delete('/:id', adminMiddleware, deletePrompt);

export default router;
