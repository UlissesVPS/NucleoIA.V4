import { Router } from 'express';
import { listUsers, getUser, updateUser, updateUserStatus, updateSubscription, getOnlineUsers, getUserStats } from '../controllers/users.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', listUsers);
router.get('/online', getOnlineUsers);
router.get('/stats', getUserStats);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);
router.patch('/:id/subscription', updateSubscription);

export default router;
