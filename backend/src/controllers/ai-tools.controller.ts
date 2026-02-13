import { Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const listAiTools = async (req: AuthRequest, res: Response) => {
  try {
    const category = req.query.category as string;
    const where: any = { isActive: true };
    if (category) where.category = category;

    const tools = await prisma.aiTool.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    // Filter by plan
    const userPlan = req.user!.plan;
    const result = tools.map((tool) => ({
      ...tool,
      hasAccess: !!userPlan || tool.unlimited,
    }));

    return successResponse(res, result);
  } catch (error) {
    return errorResponse(res, 'AI_TOOLS_ERROR', 'Erro ao listar ferramentas', 500);
  }
};

export const getAiTool = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tool = await prisma.aiTool.findUnique({ where: { id } });

    if (!tool) {
      return errorResponse(res, 'TOOL_NOT_FOUND', 'Ferramenta nao encontrada', 404);
    }

    return successResponse(res, {
      ...tool,
      hasAccess: !!req.user!.plan || tool.unlimited,
    });
  } catch (error) {
    return errorResponse(res, 'AI_TOOL_ERROR', 'Erro ao buscar ferramenta', 500);
  }
};

export const createAiTool = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, imageUrl, category, unlimited, accessUrl, order } = req.body;

    const tool = await prisma.aiTool.create({
      data: { name, description, imageUrl, category, unlimited, accessUrl, order },
    });

    return successResponse(res, tool, undefined, 201);
  } catch (error) {
    return errorResponse(res, 'TOOL_CREATE_ERROR', 'Erro ao criar ferramenta', 500);
  }
};

export const updateAiTool = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, category, unlimited, accessUrl, isActive, order } = req.body;

    const tool = await prisma.aiTool.update({
      where: { id },
      data: { name, description, imageUrl, category, unlimited, accessUrl, isActive, order },
    });

    return successResponse(res, tool);
  } catch (error) {
    return errorResponse(res, 'TOOL_UPDATE_ERROR', 'Erro ao atualizar ferramenta', 500);
  }
};

export const deleteAiTool = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.aiTool.delete({ where: { id } });

    return successResponse(res, { message: 'Ferramenta deletada' });
  } catch (error) {
    return errorResponse(res, 'TOOL_DELETE_ERROR', 'Erro ao deletar ferramenta', 500);
  }
};

export const updateToolOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { order } = req.body;

    const tool = await prisma.aiTool.update({
      where: { id },
      data: { order },
    });

    return successResponse(res, tool);
  } catch (error) {
    return errorResponse(res, 'ORDER_ERROR', 'Erro ao atualizar ordem', 500);
  }
};
