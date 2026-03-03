import { Router } from 'express';
import { phAuthMiddleware } from '../middleware/prompthub-auth.middleware';
import * as phAuth from '../controllers/prompthub-auth.controller';
import * as phData from '../controllers/prompthub-data.controller';

const router = Router();

// ==========================================
// AUTH (public)
// ==========================================
router.post('/auth/register', phAuth.register as any);
router.post('/auth/login', phAuth.login as any);

// AUTH (protected)
router.get('/auth/me', phAuthMiddleware as any, phAuth.getMe as any);
router.post('/auth/logout', phAuthMiddleware as any, phData.logout as any);

// ==========================================
// PROFILE
// ==========================================
router.get('/profile', phAuthMiddleware as any, phData.getProfile as any);
router.put('/profile', phAuthMiddleware as any, phData.updateProfile as any);
router.get('/profile/stats', phAuthMiddleware as any, phData.getProfileStats as any);
router.put('/profile/preferences', phAuthMiddleware as any, phData.updatePreferences as any);
router.put('/profile/avatar', phAuthMiddleware as any, phData.updateAvatar as any);
router.put('/profile/password', phAuthMiddleware as any, phData.changePassword as any);
router.get('/profile/first-access-popup', phAuthMiddleware as any, phData.getFirstAccessPopupStatus as any);
router.put('/profile/first-access-popup/dismiss', phAuthMiddleware as any, phData.dismissFirstAccessPopup as any);

// ==========================================
// SYSTEM STATS
// ==========================================
router.get('/system/stats/public', phData.getDashboardStats as any);
router.get('/system/stats', phAuthMiddleware as any, phData.getDashboardStats as any);

// ==========================================
// SESSIONS
// ==========================================
router.post('/sessions/heartbeat', phAuthMiddleware as any, ((_req: any, res: any) => res.json({ success: true })) as any);

// ==========================================
// SETTINGS
// ==========================================
router.get('/settings/page/:page', phAuthMiddleware as any, phData.getPageSettings as any);

// ==========================================
// AI TOOLS (empty for PH)
// ==========================================
router.get('/ai-tools', phAuthMiddleware as any, phData.getAITools as any);

// ==========================================
// PROMPTS
// ==========================================
router.get('/prompts', phAuthMiddleware as any, phData.getPrompts as any);
router.get('/prompts/community', phAuthMiddleware as any, phData.getCommunityPrompts as any);
router.get('/prompts/most-liked', phAuthMiddleware as any, phData.getMostLiked as any);
router.get('/prompts/favorites', phAuthMiddleware as any, phData.getFavorites as any);
router.post('/prompts/my', phAuthMiddleware as any, phData.createMyPrompt as any);
router.get("/prompts/my", phAuthMiddleware as any, phData.getMyPrompts as any);router.put("/prompts/my/:id", phAuthMiddleware as any, phData.updateMyPrompt as any);router.delete("/prompts/my/:id", phAuthMiddleware as any, phData.deleteMyPrompt as any);
router.post('/prompts/:id/like', phAuthMiddleware as any, phData.likePrompt as any);
router.post('/prompts/:id/copy', phAuthMiddleware as any, phData.copyPrompt as any);
router.post('/prompts/:id/favorite', phAuthMiddleware as any, phData.toggleFavorite as any);
router.patch('/prompts/:id/toggle-public', phAuthMiddleware as any, phData.togglePromptPublic as any);

// ==========================================
// AGENTS
// ==========================================
router.get('/agents', phAuthMiddleware as any, phData.getAgents as any);

// ==========================================
// COURSES
// ==========================================
router.get('/courses', phAuthMiddleware as any, phData.getCourses as any);
router.get('/courses/:id', phAuthMiddleware as any, phData.getCourse as any);
router.patch('/lessons/:lessonId/progress', phAuthMiddleware as any, phData.updateLessonProgress as any);

// ==========================================
// PRODUCTS
// ==========================================
router.get('/products', phAuthMiddleware as any, phData.getProducts as any);

// ==========================================
// CATEGORIES
// ==========================================
router.get('/categories', phAuthMiddleware as any, phData.getCategories as any);

// ==========================================
// MY PROMPTS CRUD
// ==========================================
router.get('/my-prompts', phAuthMiddleware as any, phData.getMyPrompts as any);
router.post('/my-prompts', phAuthMiddleware as any, phData.createMyPrompt as any);
router.put('/my-prompts/:id', phAuthMiddleware as any, phData.updateMyPrompt as any);
router.delete('/my-prompts/:id', phAuthMiddleware as any, phData.deleteMyPrompt as any);

export default router;
