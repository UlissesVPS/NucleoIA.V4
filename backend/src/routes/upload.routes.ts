import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { uploadImage, uploadThumbnail, uploadVideo } from '../middleware/upload.middleware';
import { handleUploadImage, handleUploadThumbnail, handleUploadVideo } from '../controllers/upload.controller';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.post('/image', uploadImage, handleUploadImage);
router.post('/thumbnail', uploadThumbnail, handleUploadThumbnail);
router.post('/video', uploadVideo, handleUploadVideo);

export default router;
