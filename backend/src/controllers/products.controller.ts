import { Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const listProducts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;

    const where: any = { isActive: true };
    if (category) where.category = category;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { order: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    return successResponse(res, products, { total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return errorResponse(res, 'PRODUCTS_ERROR', 'Erro ao listar produtos', 500);
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return errorResponse(res, 'PRODUCT_NOT_FOUND', 'Produto nao encontrado', 404);
    }

    return successResponse(res, product);
  } catch (error) {
    return errorResponse(res, 'PRODUCT_ERROR', 'Erro ao buscar produto', 500);
  }
};

export const getFeaturedProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { order: 'asc' },
      take: 6,
    });

    return successResponse(res, products);
  } catch (error) {
    return errorResponse(res, 'FEATURED_ERROR', 'Erro ao buscar destaques', 500);
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const product = await prisma.product.create({ data });

    return successResponse(res, product, undefined, 201);
  } catch (error) {
    return errorResponse(res, 'PRODUCT_CREATE_ERROR', 'Erro ao criar produto', 500);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const product = await prisma.product.update({ where: { id }, data });

    return successResponse(res, product);
  } catch (error) {
    return errorResponse(res, 'PRODUCT_UPDATE_ERROR', 'Erro ao atualizar produto', 500);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id } });

    return successResponse(res, { message: 'Produto deletado' });
  } catch (error) {
    return errorResponse(res, 'PRODUCT_DELETE_ERROR', 'Erro ao deletar produto', 500);
  }
};
