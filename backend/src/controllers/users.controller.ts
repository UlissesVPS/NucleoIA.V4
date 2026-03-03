import { fireWebhookEvent } from '../services/webhook.service';
import { Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendEmail } from '../services/email.service';

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
            realSubscriptionStatus = 'SOLICITADO';
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

    // When activating a user, also activate PENDING subscriptions
    if (isActive) {
      await prisma.subscription.updateMany({
        where: { userId: id, status: 'PENDING' },
        data: { status: 'ACTIVE', startedAt: new Date() },
      });
    }

    // When suspending a user, set subscription to SUSPENDED
    if (!isActive) {
      await prisma.subscription.updateMany({
        where: { userId: id, status: { in: ['ACTIVE', 'PENDING'] } },
        data: { status: 'SUSPENDED' },
      });
    }

    const action = isActive ? 'approved' : 'suspended';

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        type: isActive ? 'ADMIN' : 'SUSPEND',
        description: `Usuario ${user.email} ${isActive ? 'aprovado/ativado' : 'suspenso'}`,
        ipAddress: req.ip,
        metadata: { targetUserId: id },
      },
    });

    // Fire webhook
    fireWebhookEvent('user.updated', { id: user.id, email: user.email, isActive: user.isActive, action });

    // Send approval email (non-blocking - approval happens regardless)
    let emailSent = false;
    if (isActive) {
      emailSent = await sendApprovalEmail(user.id, user.email, user.name);
    }

    return successResponse(res, { id: user.id, isActive: user.isActive, emailSent });
  } catch (error) {
    return errorResponse(res, 'USER_STATUS_ERROR', 'Erro ao alterar status', 500);
  }
};

// ==================== APPROVAL EMAIL (HELPER) ====================
async function sendApprovalEmail(userId: string, email: string, name: string | null): Promise<boolean> {
  try {
    // Deduplication check
    const userCheck = await prisma.user.findUnique({ where: { id: userId }, select: { approvalEmailSent: true } });
    if (userCheck?.approvalEmailSent) {
      console.log(`[APPROVAL] Email already sent to ${email}, skipping`);
      return true;
    }

    const firstName = name?.split(' ')[0] || 'Membro';
    const loginUrl = 'https://painel.nucleoia.online/login';
    const year = new Date().getFullYear();

    await sendEmail({
      to: email,
      subject: 'Seu acesso ao NUCLEO IA foi aprovado!',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; padding: 0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #F97316;">
            <h1 style="color: #F97316; font-size: 32px; margin: 0; font-weight: 800; letter-spacing: 2px;">NUCLEO IA</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 8px; letter-spacing: 3px; text-transform: uppercase;">Seu hub de inteligencia artificial</p>
          </div>

          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #F97316, #ea580c); width: 64px; height: 64px; border-radius: 50%; line-height: 64px; font-size: 32px;">
                &#127881;
              </div>
            </div>

            <h2 style="color: #e2e8f0; font-size: 22px; margin: 0 0 16px; text-align: center;">
              Ola, ${firstName}!
            </h2>

            <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
              Temos otimas noticias: <strong style="color: #F97316;">seu acesso foi aprovado!</strong>
            </p>

            <div style="background: #16213e; border-radius: 12px; padding: 24px; border: 1px solid #2a2a4a; margin-bottom: 30px;">
              <p style="color: #e2e8f0; font-size: 14px; line-height: 1.8; margin: 0;">
                A partir de agora voce tem acesso completo a plataforma, incluindo:
              </p>
              <ul style="color: #94a3b8; font-size: 14px; line-height: 2; margin: 12px 0 0; padding-left: 20px;">
                <li><strong style="color: #e2e8f0;">Cursos e Aulas</strong> exclusivas sobre IA</li>
                <li><strong style="color: #e2e8f0;">Ferramentas de IA</strong> com acesso direto</li>
                <li><strong style="color: #e2e8f0;">Biblioteca de Prompts</strong> prontos para uso</li>
                <li><strong style="color: #e2e8f0;">Autenticador 2FA</strong> integrado</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}"
                 style="display: inline-block; background: linear-gradient(135deg, #F97316, #ea580c); color: white; padding: 16px 48px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(249,115,22,0.4);">
                ACESSAR PLATAFORMA
              </a>
            </div>

            <div style="background: #1e1e32; border-radius: 10px; padding: 20px; border-left: 3px solid #F97316; margin-top: 30px;">
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
                <strong style="color: #e2e8f0;">Primeiro acesso?</strong><br/>
                Use o email <strong style="color: #F97316;">${email}</strong> para fazer login.
                Caso ainda nao tenha definido uma senha, verifique sua caixa de entrada
                por um email anterior com o link de criacao de senha.
              </p>
            </div>
          </div>

          <div style="background: #0a0a14; padding: 24px 30px; text-align: center; border-top: 1px solid #1e1e32;">
            <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">
              Precisa de ajuda? Entre em contato:
            </p>
            <a href="mailto:suporte@nucleoia.online" style="color: #F97316; text-decoration: none; font-size: 13px; font-weight: 600;">
              suporte@nucleoia.online
            </a>
            <p style="color: #374151; font-size: 11px; margin-top: 16px;">
              &copy; ${year} Nucleo IA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `,
    });

    // Mark as sent (deduplication)
    await prisma.user.update({
      where: { id: userId },
      data: { approvalEmailSent: true },
    });

    console.log(`[APPROVAL] Email de aprovacao enviado para: ${email}`);
    return true;
  } catch (error) {
    console.error(`[APPROVAL] Falha ao enviar email para ${email}:`, error);
    return false;
  }
}

export const updateSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { plan, planTier, expiresAt } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse(res, 'USER_NOT_FOUND', 'Usuario nao encontrado', 404);
    }

    // Build update data with only provided fields
    const updateData: any = {};
    if (plan) updateData.plan = plan;
    if (planTier) updateData.planTier = planTier;
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    // When extending expiration date, automatically reactivate the subscription
    const isExtendingDate = expiresAt && new Date(expiresAt) > new Date();
    if (isExtendingDate) {
      updateData.status = 'ACTIVE';
      updateData.startedAt = new Date();
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: id },
      update: updateData,
      create: {
        userId: id,
        plan: plan || 'MENSAL',
        planTier: planTier || 'DIAMANTE',
        status: 'ACTIVE',
        startedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // If subscription is now ACTIVE, ensure user.isActive is also true
    if (subscription.status === 'ACTIVE' && !user.isActive) {
      await prisma.user.update({
        where: { id },
        data: { isActive: true },
      });
      console.log(`[updateSubscription] Auto-activated user ${user.email} (subscription extended)`);
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        type: 'ADMIN',
        description: `Assinatura do usuario ${user.email} atualizada${plan ? ` - plano: ${plan}` : ''}${expiresAt ? ` - expira: ${new Date(expiresAt).toLocaleDateString('pt-BR')}` : ''}${isExtendingDate ? ' - status: ACTIVE' : ''}`,
        ipAddress: req.ip,
        metadata: { targetUserId: id, plan, planTier, expiresAt },
      },
    });

    // Fire webhook
    fireWebhookEvent('subscription.updated', { userId: subscription.userId, plan: subscription.plan, planTier: subscription.planTier, status: subscription.status, expiresAt: subscription.expiresAt });

    return successResponse(res, {
      id: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan,
      planTier: subscription.planTier,
      status: subscription.status,
      expiresAt: subscription.expiresAt,
      userActivated: subscription.status === 'ACTIVE' && !user.isActive,
    });
  } catch (error) {
    console.error('[updateSubscription] Error:', error);
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
