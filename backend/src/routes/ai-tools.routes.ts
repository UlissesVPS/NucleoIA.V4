import { Router } from 'express';
import { listAiTools, getAiTool, createAiTool, updateAiTool, deleteAiTool, updateToolOrder } from '../controllers/ai-tools.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listAiTools);
router.get('/:id', getAiTool);

// Admin only
router.post('/', adminMiddleware, createAiTool);
router.put('/:id', adminMiddleware, updateAiTool);
router.delete('/:id', adminMiddleware, deleteAiTool);
router.patch('/:id/order', adminMiddleware, updateToolOrder);

export default router;
