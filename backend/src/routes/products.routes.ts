import { Router } from 'express';
import { listProducts, getProduct, getFeaturedProducts, createProduct, updateProduct, deleteProduct } from '../controllers/products.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProduct);

// Admin only
router.post('/', adminMiddleware, createProduct);
router.put('/:id', adminMiddleware, updateProduct);
router.delete('/:id', adminMiddleware, deleteProduct);

export default router;
