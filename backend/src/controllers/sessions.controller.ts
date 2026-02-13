import { Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const heartbeat = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPage } = req.body;

    await prisma.session.updateMany({
      where: {
        userId: req.user!.id,
        isActive: true,
      },
      data: {
        currentPage,
        lastActivity: new Date(),
      },
    });

    return successResponse(res, { ok: true });
  } catch (error) {
    return errorResponse(res, 'HEARTBEAT_ERROR', 'Erro no heartbeat', 500);
  }
};

export const getActiveSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user!.id, isActive: true },
      orderBy: { lastActivity: 'desc' },
    });

    return successResponse(
      res,
      sessions.map((s) => ({
        id: s.id,
        device: s.device,
        browser: s.browser,
        city: s.city,
        currentPage: s.currentPage,
        connectedAt: s.connectedAt,
        lastActivity: s.lastActivity,
      }))
    );
  } catch (error) {
    return errorResponse(res, 'SESSIONS_ERROR', 'Erro ao buscar sessoes', 500);
  }
};

export const endSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({ where: { id } });

    if (!session || session.userId !== req.user!.id) {
      return errorResponse(res, 'SESSION_NOT_FOUND', 'Sessao nao encontrada', 404);
    }

    await prisma.session.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse(res, { message: 'Sessao encerrada' });
  } catch (error) {
    return errorResponse(res, 'END_SESSION_ERROR', 'Erro ao encerrar sessao', 500);
  }
};
