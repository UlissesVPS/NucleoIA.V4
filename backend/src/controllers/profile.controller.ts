import { Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { subscription: true },
    });

    if (!user) {
      return errorResponse(res, 'USER_NOT_FOUND', 'Usuario nao encontrado', 404);
    }

    return successResponse(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      location: user.location,
      language: user.language,
      theme: user.theme,
      notifyEmail: user.notifyEmail,
      notifyPush: user.notifyPush,
      notifySound: user.notifySound,
      notifyNewCourse: user.notifyNewCourse,
      notifyNewPrompt: user.notifyNewPrompt,
      notifyMarketing: user.notifyMarketing,
      notifyUpdates: user.notifyUpdates,
      plan: user.subscription?.plan || 'MENSAL',
      subscriptionStatus: user.subscription?.status || 'INACTIVE',
      startedAt: user.subscription?.startedAt,
      expiresAt: user.subscription?.expiresAt,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return errorResponse(res, 'PROFILE_ERROR', 'Erro ao buscar perfil', 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, location } = req.body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (location !== undefined) data.location = location;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
    });

    return successResponse(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
    });
  } catch (error) {
    return errorResponse(res, 'PROFILE_UPDATE_ERROR', 'Erro ao atualizar perfil', 500);
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const {
      language, theme,
      notifyEmail, notifyPush, notifySound,
      notifyNewCourse, notifyNewPrompt, notifyMarketing, notifyUpdates,
    } = req.body;

    const data: Record<string, any> = {};
    if (language !== undefined) data.language = language;
    if (theme !== undefined) data.theme = theme;
    if (notifyEmail !== undefined) data.notifyEmail = notifyEmail;
    if (notifyPush !== undefined) data.notifyPush = notifyPush;
    if (notifySound !== undefined) data.notifySound = notifySound;
    if (notifyNewCourse !== undefined) data.notifyNewCourse = notifyNewCourse;
    if (notifyNewPrompt !== undefined) data.notifyNewPrompt = notifyNewPrompt;
    if (notifyMarketing !== undefined) data.notifyMarketing = notifyMarketing;
    if (notifyUpdates !== undefined) data.notifyUpdates = notifyUpdates;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
    });

    return successResponse(res, {
      language: user.language,
      theme: user.theme,
      notifyEmail: user.notifyEmail,
      notifyPush: user.notifyPush,
      notifySound: user.notifySound,
      notifyNewCourse: user.notifyNewCourse,
      notifyNewPrompt: user.notifyNewPrompt,
      notifyMarketing: user.notifyMarketing,
      notifyUpdates: user.notifyUpdates,
    });
  } catch (error) {
    return errorResponse(res, 'PREFERENCES_ERROR', 'Erro ao atualizar preferencias', 500);
  }
};

export const getProfileStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [lessonsCompleted, promptsCopied, daysActiveResult] = await Promise.all([
      prisma.lessonProgress.count({
        where: { userId, completed: true },
      }),
      prisma.activityLog.count({
        where: { userId, type: 'COPY' },
      }),
      prisma.$queryRaw<[{ days: bigint }]>`
        SELECT COUNT(DISTINCT DATE(created_at)) as days
        FROM activity_logs WHERE user_id = ${userId}
      `,
    ]);

    const daysActive = Number(daysActiveResult[0]?.days || 0);

    // Certificados = cursos onde todas as aulas estão concluídas
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        modules: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    let certificates = 0;
    for (const course of courses) {
      const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
      if (lessonIds.length === 0) continue;

      const completed = await prisma.lessonProgress.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          completed: true,
        },
      });

      if (completed === lessonIds.length) {
        certificates++;
      }
    }

    return successResponse(res, {
      lessonsCompleted,
      promptsCopied,
      daysActive,
      certificates,
    });
  } catch (error) {
    return errorResponse(res, 'STATS_ERROR', 'Erro ao buscar estatisticas', 500);
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return errorResponse(res, 'USER_NOT_FOUND', 'Usuario nao encontrado', 404);
    }

    const validPassword = await comparePassword(currentPassword, user.passwordHash);
    if (!validPassword) {
      return errorResponse(res, 'INVALID_PASSWORD', 'Senha atual incorreta', 400);
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, needsPasswordReset: false },
    });

    return successResponse(res, { message: 'Senha alterada com sucesso' });
  } catch (error) {
    return errorResponse(res, 'PASSWORD_ERROR', 'Erro ao alterar senha', 500);
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
    });

    return successResponse(res, { avatarUrl: user.avatarUrl });
  } catch (error) {
    return errorResponse(res, 'AVATAR_ERROR', 'Erro ao atualizar avatar', 500);
  }
};


// First Access Popup
export const getFirstAccessPopupStatus = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstAccessPopupSeen: true, name: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'Usuario nao encontrado' } });
    }
    return res.json({
      success: true,
      data: {
        seen: user.firstAccessPopupSeen,
        memberName: user.name?.split(' ')[0] || 'Membro',
      },
    });
  } catch (error) {
    console.error('Error getting first access popup status:', error);
    return res.status(500).json({ success: false, error: { message: 'Erro interno' } });
  }
};

export const dismissFirstAccessPopup = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    await prisma.user.update({
      where: { id: userId },
      data: { firstAccessPopupSeen: true },
    });
    return res.json({ success: true, data: { seen: true } });
  } catch (error) {
    console.error('Error dismissing first access popup:', error);
    return res.status(500).json({ success: false, error: { message: 'Erro interno' } });
  }
};
