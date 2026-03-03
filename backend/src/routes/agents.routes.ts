import { Router } from 'express';
import { listAgents, getAgent, createAgent, updateAgent, deleteAgent } from '../controllers/agents.controller';
import { authMiddleware, adminMiddleware, planGateMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(planGateMiddleware('DIAMANTE'));

router.get('/', listAgents);
router.get('/:id', getAgent);

// Admin only
router.post('/', adminMiddleware, createAgent);
router.put('/:id', adminMiddleware, updateAgent);
router.delete('/:id', adminMiddleware, deleteAgent);

export default router;
