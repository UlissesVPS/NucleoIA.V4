import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    plan: string;
    planTier: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(res, 'AUTH_NO_TOKEN', 'Token nao fornecido', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { subscription: true },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'AUTH_USER_INACTIVE', 'Usuario inativo ou nao encontrado', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.subscription?.plan || 'MENSAL',
      planTier: user.subscription?.planTier || 'DIAMANTE',
    };

    next();
  } catch (error) {
    return errorResponse(res, 'AUTH_INVALID_TOKEN', 'Token invalido ou expirado', 401);
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return errorResponse(res, 'AUTH_FORBIDDEN', 'Acesso negado', 403);
  }
  next();
};

export const superAdminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return errorResponse(res, 'AUTH_FORBIDDEN', 'Acesso negado - Super Admin requerido', 403);
  }
  next();
};

export const planGateMiddleware = (...allowedTiers: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Admins always have full access
    if (req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return next();
    }
    if (!req.user || !allowedTiers.includes(req.user.planTier)) {
      return errorResponse(res, 'PLAN_RESTRICTED', 'Funcionalidade nao disponivel no seu plano. Faca upgrade para o Plano Diamante.', 403);
    }
    next();
  };
};
