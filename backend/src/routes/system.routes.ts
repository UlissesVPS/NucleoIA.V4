import { Router } from 'express';
import {
  sendNotification,
  getStats, getActivityLogs,
  listApiKeys, createApiKey, revokeApiKey,
  listWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook,
  getVpsStats, getOnlineUsers, getIpAlerts, getIpHistory,
  listBackups, getBackupSchedule, updateBackupSchedule,
  getPublicStats,
  adminGenerateResetLink
} from '../controllers/system.controller';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no auth required)
router.get('/stats/public', getPublicStats);

// All routes below require auth + super admin
router.use(authMiddleware, superAdminMiddleware);

router.get('/stats', getStats);
router.get('/activity-logs', getActivityLogs);
router.get('/vps-stats', getVpsStats);
router.get('/online-users', getOnlineUsers);
router.get('/ip-alerts', getIpAlerts);
router.get('/ip-history', getIpHistory);

// API Keys
router.get('/api-keys', listApiKeys);
router.post('/api-keys', createApiKey);
router.delete('/api-keys/:id', revokeApiKey);

// Webhooks
router.get('/webhooks', listWebhooks);
router.post('/webhooks', createWebhook);
router.put('/webhooks/:id', updateWebhook);
router.delete('/webhooks/:id', deleteWebhook);
router.post('/webhooks/:id/test', testWebhook);

// Backups
router.get('/backups', listBackups);
router.get('/backups/schedule', getBackupSchedule);
router.put('/backups/schedule', updateBackupSchedule);

// Notifications
router.post("/notifications/send", sendNotification);

// Admin: Manual password reset
router.post("/admin/reset-password", adminGenerateResetLink);

export default router;
