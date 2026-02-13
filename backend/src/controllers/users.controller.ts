import { fireWebhookEvent } from '../services/webhook.service';
import { Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const role = req.query.role as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { subscription: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const now = new Date();

    return successResponse(
      res,
      users.map((u) => {
        const sub = u.subscription;
        let realSubscriptionStatus = 'SEM_ASSINATURA';

        if (sub) {
          if (sub.status === 'SUSPENDED') {
            realSubscriptionStatus = 'SUSPENSO';
          } else if (sub.status === 'EXPIRED') {
            realSubscriptionStatus = 'EXPIRADO';
          } else if (sub.status === 'CANCELED') {
            realSubscriptionStatus = 'CANCELADO';
          } else if (sub.status === 'ACTIVE') {
            if (sub.expiresAt && new Date(sub.expiresAt) < now) {
              realSubscriptionStatus = 'EXPIRADO';
            } else {
              realSubscriptionStatus = 'ATIVO';
            }
          } else if (sub.status === 'INACTIVE') {
            realSubscriptionStatus = 'INATIVO';
          } else if (sub.status === 'PENDING') {
            realSubscriptionStatus = 'PENDENTE';
          }
        }

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl,
          isActive: u.isActive,
          plan: sub?.plan || 'MENSAL',
          subscriptionStatus: sub?.status || 'INACTIVE',
          realSubscriptionStatus,
          subscriptionExpiresAt: sub?.expiresAt || null,
          createdAt: u.createdAt,
        };
      }),
      { total, page, limit, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    return errorResponse(res, 'USERS_LIST_ERROR', 'Erro ao listar usuarios', 500);
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    });

    if (!user) {
      return errorResponse(res, 'USER_NOT_FOUND', 'Usuario nao encontrado', 404);
    }

    return successResponse(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      plan: user.subscription?.plan || 'MENSAL',
      subscriptionStatus: user.subscription?.status || 'INACTIVE',
      subscriptionExpiresAt: user.subscription?.expiresAt,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return errorResponse(res, 'USER_GET_ERROR', 'Erro ao buscar usuario', 500);
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, plan, status } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse(res, 'USER_NOT_FOUND', 'Usuario nao encontrado', 404);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role && req.user?.role === 'SUPER_ADMIN') updateData.role = role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { subscription: true },
    });

    // Update subscription if provided
    if (plan || status) {
      await prisma.subscription.upsert({
        where: { userId: id },
        update: {
          ...(plan && { plan }),
          ...(status && { status }),
        },
        create: {
          userId: id,
          plan: plan || 'MENSAL',
          status: status || 'ACTIVE',
        },
      });
    }

    // Fire webhook
    fireWebhookEvent('user.updated', { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role });

    return successResponse(res, {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (error) {
    return errorResponse(res, 'USER_UPDATE_ERROR', 'Erro ao atualizar usuario', 500);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        type: 'SUSPEND',
        description: `Usuario ${user.email} ${isActive ? 'reativado' : 'suspenso'}`,
        ipAddress: req.ip,
        metadata: { targetUserId: id },
      },
    });

    // Fire webhook
    fireWebhookEvent('user.updated', { id: user.id, email: user.email, isActive: user.isActive, action: isActive ? 'reactivated' : 'suspended' });

    return successResponse(res, { id: user.id, isActive: user.isActive });
  } catch (error) {
    return errorResponse(res, 'USER_STATUS_ERROR', 'Erro ao alterar status', 500);
  }
};

export const updateSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { plan, expiresAt } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse(res, 'USER_NOT_FOUND', 'Usuario nao encontrado', 404);
    }

    const updateData: any = {};
    if (plan) updateData.plan = plan;
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: id },
      update: updateData,
      create: {
        userId: id,
        plan: plan || 'MENSAL',
        status: 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        type: 'ADMIN',
        description: `Assinatura do usuario ${user.email} atualizada${plan ? ` - plano: ${plan}` : ''}${expiresAt ? ` - expira: ${new Date(expiresAt).toLocaleDateString('pt-BR')}` : ''}`,
        ipAddress: req.ip,
        metadata: { targetUserId: id, plan, expiresAt },
      },
    });

    // Fire webhook
    fireWebhookEvent('subscription.created', { userId: subscription.userId, plan: subscription.plan, status: subscription.status, expiresAt: subscription.expiresAt });

    return successResponse(res, {
      id: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan,
      status: subscription.status,
      expiresAt: subscription.expiresAt,
    });
  } catch (error) {
    return errorResponse(res, 'SUBSCRIPTION_UPDATE_ERROR', 'Erro ao atualizar assinatura', 500);
  }
};

export const getOnlineUsers = async (req: AuthRequest, res: Response) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const sessions = await prisma.session.findMany({
      where: {
        isActive: true,
        lastActivity: { gte: fiveMinutesAgo },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { lastActivity: 'desc' },
    });

    return successResponse(
      res,
      sessions.map((s) => ({
        sessionId: s.id,
        user: s.user,
        currentPage: s.currentPage,
        device: s.device,
        browser: s.browser,
        city: s.city,
        connectedAt: s.connectedAt,
        lastActivity: s.lastActivity,
      }))
    );
  } catch (error) {
    return errorResponse(res, 'ONLINE_USERS_ERROR', 'Erro ao buscar usuarios online', 500);
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    const allUsers = await prisma.user.findMany({
      include: { subscription: true },
    });

    let totalMembers = 0;
    let trulyActive = 0;
    let expired = 0;
    let suspended = 0;
    let noSubscription = 0;
    let inactive = 0;

    for (const user of allUsers) {
      totalMembers++;

      if (!user.isActive) {
        inactive++;
      }

      const sub = user.subscription;

      if (!sub) {
        noSubscription++;
        continue;
      }

      if (sub.status === 'SUSPENDED') {
        suspended++;
      } else if (sub.status === 'EXPIRED') {
        expired++;
      } else if (sub.status === 'CANCELED') {
        expired++;
      } else if (sub.status === 'ACTIVE') {
        if (sub.expiresAt && new Date(sub.expiresAt) < now) {
          expired++;
        } else if (user.isActive) {
          trulyActive++;
        } else {
          suspended++;
        }
      } else {
        noSubscription++;
      }
    }

    return successResponse(res, {
      totalMembers,
      trulyActive,
      expired,
      suspended,
      noSubscription,
      inactive,
    });
  } catch (error) {
    return errorResponse(res, 'STATS_ERROR', 'Erro ao buscar estatisticas', 500);
  }
};
