import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { getPageSettings, updatePageSettings } from '../controllers/settings.controller';

const router = Router();

router.get('/page/:page', authMiddleware, getPageSettings);
router.put('/page/:page', authMiddleware, adminMiddleware, updatePageSettings);

export default router;
