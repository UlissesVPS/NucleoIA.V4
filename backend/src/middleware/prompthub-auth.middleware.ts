import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient();

export interface PHAuthRequest extends Request {
  phUser?: {
    id: string;
    email: string;
    name: string;
  };
}

export const phAuthMiddleware = async (req: PHAuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token nao fornecido' } });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    // Must be a Prompt Hub token
    if (decoded.type !== 'prompt_hub') {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token invalido para Prompt Hub' } });
    }

    const user = await prisma.promptHubUser.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Usuario nao encontrado ou inativo' } });
    }

    req.phUser = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token invalido ou expirado' } });
  }
};
