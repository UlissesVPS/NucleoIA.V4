import { Router } from 'express';
import { register, login, logout, me, refresh, validateFirstAccess, setFirstPassword } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Authenticated routes
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);
router.post('/refresh', refresh);

// First access (public)
router.get('/first-access/:token', validateFirstAccess);
router.post('/first-access/:token', setFirstPassword);

export default router;
