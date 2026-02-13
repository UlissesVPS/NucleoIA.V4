import { Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const listCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return successResponse(res, categories);
  } catch (error) {
    return errorResponse(res, 'CATEGORIES_ERROR', 'Erro ao listar categorias', 500);
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const category = await prisma.category.create({
      data: { name, slug },
    });

    return successResponse(res, category, undefined, 201);
  } catch (error) {
    return errorResponse(res, 'CATEGORY_CREATE_ERROR', 'Erro ao criar categoria', 500);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });

    return successResponse(res, category);
  } catch (error) {
    return errorResponse(res, 'CATEGORY_UPDATE_ERROR', 'Erro ao atualizar categoria', 500);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({ where: { id } });

    return successResponse(res, { message: 'Categoria deletada' });
  } catch (error) {
    return errorResponse(res, 'CATEGORY_DELETE_ERROR', 'Erro ao deletar categoria', 500);
  }
};
