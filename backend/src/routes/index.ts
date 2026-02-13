import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import promptsRoutes from './prompts.routes';
import categoriesRoutes from './categories.routes';
import coursesRoutes from './courses.routes';
import aiToolsRoutes from './ai-tools.routes';
import productsRoutes from './products.routes';
import systemRoutes from './system.routes';
import sessionsRoutes from './sessions.routes';
import profileRoutes from './profile.routes';
import magicLinkRoutes from './magiclink.routes';
import webhookRoutes from './webhook.routes';
import sharedCredentialsRoutes from './shared-credentials.routes';
import uploadRoutes from './upload.routes';
import settingsRoutes from './settings.routes';
import totpRoutes from './totp.routes';
import apiRoutes from './api.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/prompts', promptsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/courses', coursesRoutes);
router.use('/ai-tools', aiToolsRoutes);
router.use('/products', productsRoutes);
router.use('/system', systemRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/profile', profileRoutes);
router.use('/auth/magic-link', magicLinkRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/shared-credentials', sharedCredentialsRoutes);
router.use('/upload', uploadRoutes);
router.use('/settings', settingsRoutes);
router.use('/totp', totpRoutes);
router.use('/api/v1', apiRoutes);

export default router;
