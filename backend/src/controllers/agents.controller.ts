import { Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const listAgents = async (req: AuthRequest, res: Response) => {
  try {
    const category = req.query.category as string;
    const where: any = { isActive: true };
    if (category && category !== 'all') where.category = category;

    const agents = await prisma.agent.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return successResponse(res, agents);
  } catch (error) {
    return errorResponse(res, 'AGENTS_ERROR', 'Erro ao listar agentes', 500);
  }
};

export const getAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      return errorResponse(res, 'AGENT_NOT_FOUND', 'Agente nao encontrado', 404);
    }

    return successResponse(res, agent);
  } catch (error) {
    return errorResponse(res, 'AGENT_ERROR', 'Erro ao buscar agente', 500);
  }
};

export const createAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, imageUrl, category, externalUrl, badge, isActive, order } = req.body;

    const agent = await prisma.agent.create({
      data: { name, description, imageUrl, category, externalUrl: externalUrl || '', badge, isActive, order },
    });

    return successResponse(res, agent, undefined, 201);
  } catch (error) {
    return errorResponse(res, 'AGENT_CREATE_ERROR', 'Erro ao criar agente', 500);
  }
};

export const updateAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, category, externalUrl, badge, isActive, order } = req.body;

    const agent = await prisma.agent.update({
      where: { id },
      data: { name, description, imageUrl, category, externalUrl, badge, isActive, order },
    });

    return successResponse(res, agent);
  } catch (error) {
    return errorResponse(res, 'AGENT_UPDATE_ERROR', 'Erro ao atualizar agente', 500);
  }
};

export const deleteAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.agent.delete({ where: { id } });
    return successResponse(res, { message: 'Agente deletado' });
  } catch (error) {
    return errorResponse(res, 'AGENT_DELETE_ERROR', 'Erro ao deletar agente', 500);
  }
};
