import { Router } from 'express';
import { generateCode, getStatus, setSecret, getCurrentCode } from '../controllers/totp.controller';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.post('/generate', generateCode);
router.get('/status', getStatus);
router.get('/code', getCurrentCode);
router.put('/secret', superAdminMiddleware, setSecret);

export default router;
