import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { uploadImage, uploadThumbnail, uploadVideo } from '../middleware/upload.middleware';
import { handleUploadImage, handleUploadThumbnail, handleUploadVideo } from '../controllers/upload.controller';

const router = Router();

router.use(authMiddleware);

// Member routes (any logged-in user can upload for their prompts)
router.post('/member/image', uploadImage, handleUploadImage);
router.post('/member/thumbnail', uploadThumbnail, handleUploadThumbnail);
router.post('/member/video', uploadVideo, handleUploadVideo);

// Admin routes
router.post('/image', adminMiddleware, uploadImage, handleUploadImage);
router.post('/thumbnail', adminMiddleware, uploadThumbnail, handleUploadThumbnail);
router.post('/video', adminMiddleware, uploadVideo, handleUploadVideo);

export default router;
