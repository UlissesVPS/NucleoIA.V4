import { Router } from 'express';
import { listSharedCredentials, updateSharedCredential } from '../controllers/shared-credentials.controller';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', listSharedCredentials);
router.put('/:id', superAdminMiddleware, updateSharedCredential);

export default router;
