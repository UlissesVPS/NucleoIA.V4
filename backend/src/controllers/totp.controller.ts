import { Response } from 'express';
import { generateSync, verify } from 'otplib';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

const MONTHLY_LIMIT = 3;

async function getMonthlyUsage(userId: string, toolName: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.totpCode.count({
    where: {
      userId,
      toolName,
      createdAt: { gte: startOfMonth },
    },
  });
}

async function getToolSecret(toolName: string): Promise<string | null> {
  const credential = await prisma.sharedCredential.findFirst({
    where: { serviceName: { equals: toolName, mode: 'insensitive' }, isActive: true },
    select: { totpSecret: true },
  });
  return credential?.totpSecret || null;
}

export const generateCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const toolName = (req.body.toolName as string) || 'Dicloak';

    const isAdminUser = ['ADMIN', 'SUPER_ADMIN'].includes(role);

    if (!isAdminUser) {
      const usedThisMonth = await getMonthlyUsage(userId, toolName);
      if (usedThisMonth >= MONTHLY_LIMIT) {
        return errorResponse(res, 'TOTP_LIMIT_REACHED', 'Limite mensal de codigos atingido', 429);
      }
    }

    const secret = await getToolSecret(toolName);
    if (!secret) {
      return errorResponse(res, 'TOTP_NO_SECRET', 'Segredo TOTP nao configurado para esta ferramenta', 404);
    }

    const code = generateSync({ secret });
    const epoch = Math.floor(Date.now() / 1000);
    const timeRemaining = 30 - (epoch % 30);

    await prisma.totpCode.create({
      data: {
        userId,
        toolName,
        secret: '***',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        type: 'TWO_FA',
        description: `Codigo 2FA gerado para ${toolName}`,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || null,
        metadata: { toolName },
      },
    });

    const usedThisMonth = isAdminUser ? 0 : await getMonthlyUsage(userId, toolName);

    return successResponse(res, {
      code,
      timeRemaining,
      usedThisMonth,
      maxAllowed: isAdminUser ? null : MONTHLY_LIMIT,
      isUnlimited: isAdminUser,
    });
  } catch (error) {
    console.error('TOTP generate error:', error);
    return errorResponse(res, 'TOTP_GENERATE_ERROR', 'Erro ao gerar codigo TOTP', 500);
  }
};

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const toolName = (req.query.toolName as string) || 'Dicloak';

    const isAdminUser = ['ADMIN', 'SUPER_ADMIN'].includes(role);
    const usedThisMonth = isAdminUser ? 0 : await getMonthlyUsage(userId, toolName);

    const epoch = Math.floor(Date.now() / 1000);
    const timeRemaining = 30 - (epoch % 30);

    return successResponse(res, {
      usedThisMonth,
      maxAllowed: isAdminUser ? null : MONTHLY_LIMIT,
      isUnlimited: isAdminUser,
      timeRemaining,
    });
  } catch (error) {
    return errorResponse(res, 'TOTP_STATUS_ERROR', 'Erro ao buscar status TOTP', 500);
  }
};

export const setSecret = async (req: AuthRequest, res: Response) => {
  try {
    const { toolName, secret } = req.body;

    if (!toolName || !secret) {
      return errorResponse(res, 'TOTP_INVALID_INPUT', 'toolName e secret sao obrigatorios', 400);
    }

    // Validate the secret
    try {
      generateSync({ secret });
    } catch {
      return errorResponse(res, 'TOTP_INVALID_SECRET', 'Segredo TOTP invalido (deve ser base32)', 400);
    }

    const existing = await prisma.sharedCredential.findFirst({
      where: { serviceName: { equals: toolName, mode: 'insensitive' } },
    });

    if (existing) {
      await prisma.sharedCredential.update({
        where: { id: existing.id },
        data: { totpSecret: secret },
      });
    } else {
      await prisma.sharedCredential.create({
        data: {
          serviceName: toolName,
          totpSecret: secret,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        type: 'ADMIN',
        description: `Segredo TOTP atualizado para ${toolName}`,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || null,
      },
    });

    return successResponse(res, { message: 'Segredo TOTP atualizado com sucesso' });
  } catch (error) {
    return errorResponse(res, 'TOTP_SECRET_ERROR', 'Erro ao atualizar segredo TOTP', 500);
  }
};

// GET /totp/code — return current code WITHOUT consuming an attempt
// Only works if user has generated at least once this month (or is admin)
export const getCurrentCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const toolName = (req.query.toolName as string) || 'Dicloak';

    const isAdminUser = ['ADMIN', 'SUPER_ADMIN'].includes(role);

    // Non-admin must have at least 1 generation this month
    if (!isAdminUser) {
      const usedThisMonth = await getMonthlyUsage(userId, toolName);
      if (usedThisMonth < 1) {
        return errorResponse(res, 'TOTP_NO_SESSION', 'Gere um codigo primeiro', 403);
      }
    }

    const secret = await getToolSecret(toolName);
    if (!secret) {
      return errorResponse(res, 'TOTP_NO_SECRET', 'Segredo TOTP nao configurado', 404);
    }

    const code = generateSync({ secret });
    const epoch = Math.floor(Date.now() / 1000);
    const timeRemaining = 30 - (epoch % 30);

    return successResponse(res, { code, timeRemaining });
  } catch (error) {
    return errorResponse(res, 'TOTP_CODE_ERROR', 'Erro ao buscar codigo TOTP', 500);
  }
};
