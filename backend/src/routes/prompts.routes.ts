import { Router } from 'express';
import {
  listPrompts, getPrompt, createPrompt, updatePrompt, deletePrompt, updateMyPrompt, deleteMyPrompt,
  toggleLike, toggleFavorite, getMyFavorites, getMostLiked,
  copyPrompt, getMyPrompts, createCommunityPrompt, togglePromptPublic, bulkImportPrompts, downloadImages, bulkDeletePrompts
} from '../controllers/prompts.controller';
import { authMiddleware, adminMiddleware, planGateMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(planGateMiddleware('DIAMANTE'));

router.get('/', listPrompts);
router.get('/my', getMyPrompts);
router.get('/favorites', getMyFavorites);
router.get('/most-liked', getMostLiked);
router.post('/my', createCommunityPrompt);
router.put('/my/:id', updateMyPrompt);
router.delete('/my/:id', deleteMyPrompt);
router.get('/:id', getPrompt);
router.post('/:id/like', toggleLike);
router.post('/:id/favorite', toggleFavorite);
router.post('/:id/copy', copyPrompt);
router.patch('/:id/toggle-public', togglePromptPublic);

// Admin only
router.delete('/bulk-delete', adminMiddleware, bulkDeletePrompts);
router.post('/download-images', adminMiddleware, downloadImages);
router.post('/bulk-import', adminMiddleware, bulkImportPrompts);
router.post('/', adminMiddleware, createPrompt);
router.put('/:id', adminMiddleware, updatePrompt);
router.delete('/:id', adminMiddleware, deletePrompt);

export default router;
