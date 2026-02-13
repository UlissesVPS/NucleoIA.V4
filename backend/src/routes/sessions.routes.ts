import { Router } from 'express';
import { heartbeat, getActiveSessions, endSession } from '../controllers/sessions.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/heartbeat', heartbeat);
router.get('/active', getActiveSessions);
router.delete('/:id', endSession);

export default router;
