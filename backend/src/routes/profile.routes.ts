import { Router } from 'express';
import { getProfile, updateProfile, updatePreferences, getProfileStats, updatePassword, updateAvatar, getFirstAccessPopupStatus, dismissFirstAccessPopup } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/preferences', updatePreferences);
router.get('/stats', getProfileStats);
router.put('/password', updatePassword);
router.put('/avatar', updateAvatar);


// First Access Popup
router.get('/first-access-popup', getFirstAccessPopupStatus);
router.put('/first-access-popup/dismiss', dismissFirstAccessPopup);

export default router;
