import { Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const listSharedCredentials = async (req: AuthRequest, res: Response) => {
  try {
    const serviceName = req.query.service as string | undefined;

    const where: any = { isActive: true };
    if (serviceName) {
      where.serviceName = { contains: serviceName, mode: 'insensitive' };
    }

    const credentials = await prisma.sharedCredential.findMany({
      where,
      select: {
        id: true,
        serviceName: true,
        loginUrl: true,
        username: true,
        password: true,
        notes: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return successResponse(res, credentials);
  } catch (error) {
    return errorResponse(res, 'CREDENTIALS_LIST_ERROR', 'Erro ao listar credenciais', 500);
  }
};

export const updateSharedCredential = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    const credential = await prisma.sharedCredential.update({
      where: { id },
      data: {
        ...(username !== undefined && { username }),
        ...(password !== undefined && { password }),
      },
    });

    return successResponse(res, credential);
  } catch (error) {
    return errorResponse(res, 'CREDENTIALS_UPDATE_ERROR', 'Erro ao atualizar credenciais', 500);
  }
};
