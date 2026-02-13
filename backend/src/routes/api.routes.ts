import { Router, Response } from 'express';
import { apiKeyMiddleware, requirePermission, ApiKeyRequest } from '../middleware/apikey.middleware';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// All routes require API key
router.use(apiKeyMiddleware);

// GET /api/v1/prompts - List prompts
router.get('/prompts', requirePermission('prompts:read'), async (req: ApiKeyRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const type = req.query.type as string;
    const category = req.query.category as string;

    const where: any = { isCommunity: false };
    if (type) where.type = type;
    if (category) where.categoryId = category;

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prompt.count({ where }),
    ]);

    return successResponse(
      res,
      prompts.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        category: p.category.name,
        description: p.description,
        tags: p.tags,
        likes: p.likes,
        createdAt: p.createdAt,
      })),
      { total, page, limit, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    return errorResponse(res, 'API_PROMPTS_ERROR', 'Erro ao listar prompts', 500);
  }
});

// GET /api/v1/categories - List categories
router.get('/categories', requirePermission('categories:read'), async (req: ApiKeyRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return successResponse(
      res,
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        promptCount: c.promptCount,
      }))
    );
  } catch (error) {
    return errorResponse(res, 'API_CATEGORIES_ERROR', 'Erro ao listar categorias', 500);
  }
});

// GET /api/v1/products - List products
router.get('/products', requirePermission('products:read'), async (req: ApiKeyRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    return successResponse(
      res,
      products.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        price: p.price,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
      })),
      { total, page, limit, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    return errorResponse(res, 'API_PRODUCTS_ERROR', 'Erro ao listar produtos', 500);
  }
});

// GET /api/v1/courses - List published courses
router.get('/courses', requirePermission('courses:read'), async (req: ApiKeyRequest, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        modules: {
          include: { lessons: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return successResponse(
      res,
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail,
        totalDuration: c.totalDuration,
        modulesCount: c.modules.length,
        totalLessons: c.modules.reduce((acc, m) => acc + m.lessons.length, 0),
        createdAt: c.createdAt,
      }))
    );
  } catch (error) {
    return errorResponse(res, 'API_COURSES_ERROR', 'Erro ao listar cursos', 500);
  }
});

// GET /api/v1/stats - System stats
router.get('/stats', requirePermission('system:read'), async (req: ApiKeyRequest, res: Response) => {
  try {
    const [totalUsers, totalPrompts, totalProducts, totalCourses] = await Promise.all([
      prisma.user.count(),
      prisma.prompt.count(),
      prisma.product.count(),
      prisma.course.count({ where: { isPublished: true } }),
    ]);

    return successResponse(res, {
      totalUsers,
      totalPrompts,
      totalProducts,
      totalCourses,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(res, 'API_STATS_ERROR', 'Erro ao buscar estatisticas', 500);
  }
});

export default router;
