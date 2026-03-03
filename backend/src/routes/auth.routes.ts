import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, me, refresh, validateFirstAccess, setFirstPassword, forgotPassword, resetPassword, validateResetToken } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Rate limiters for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Muitas tentativas de recuperacao. Aguarde 1 hora.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (rate limited)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Authenticated routes
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);
router.post('/refresh', refresh);

// First access (public)
router.get('/first-access/:token', validateFirstAccess);
router.post('/first-access/:token', setFirstPassword);

// Password reset (public, strict rate limit)
router.post('/forgot-password', strictLimiter, forgotPassword);
router.get('/reset-password/:token', validateResetToken);
router.post('/reset-password/:token', resetPassword);

export default router;
