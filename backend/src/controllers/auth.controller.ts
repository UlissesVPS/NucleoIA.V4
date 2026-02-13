import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { env } from '../config/env';

// ==================== REGISTER (PUBLIC) ====================
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return errorResponse(res, 'REGISTER_MISSING_NAME', 'O nome e obrigatorio', 400);
    }

    if (!email || !email.trim()) {
      return errorResponse(res, 'REGISTER_MISSING_EMAIL', 'O email e obrigatorio', 400);
    }

    if (!password) {
      return errorResponse(res, 'REGISTER_MISSING_PASSWORD', 'A senha e obrigatoria', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return errorResponse(res, 'REGISTER_INVALID_EMAIL', 'Formato de email invalido', 400);
    }

    // Validate password length
    if (password.length < 6) {
      return errorResponse(res, 'REGISTER_WEAK_PASSWORD', 'A senha deve ter no minimo 6 caracteres', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return errorResponse(res, 'REGISTER_EMAIL_EXISTS', 'Este email ja esta cadastrado', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with MEMBER role
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        name: name.trim(),
        role: 'MEMBER',
        isActive: false,
        needsPasswordReset: false,
      },
    });

    // Create MENSAL subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'MENSAL',
        status: 'PENDING',
      },
    });

    // Log the registration
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        description: 'Cadastro pendente de aprovacao (registro manual)',
        ipAddress: req.ip,
      },
    });

    console.log(`[REGISTER] New user registered: ${user.email} (${user.id})`);

    return successResponse(res, {
      message: 'Cadastro enviado com sucesso! Aguarde a aprovacao do administrador.',
    }, undefined, 201);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 'REGISTER_ERROR', 'Erro ao criar conta. Tente novamente.', 500);
  }
};

export const validateFirstAccess = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        firstAccessToken: token,
        firstAccessExpires: { gt: new Date() },
        needsPasswordReset: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'INVALID_TOKEN', 'Link invalido ou expirado. Solicite um novo acesso.', 400);
    }

    return successResponse(res, { email: user.email, name: user.name });
  } catch (error) {
    console.error('Erro ao validar primeiro acesso:', error);
    return errorResponse(res, 'SERVER_ERROR', 'Erro interno', 500);
  }
};

export const setFirstPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return errorResponse(res, 'INVALID_PASSWORD', 'A senha deve ter no minimo 8 caracteres', 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        firstAccessToken: token,
        firstAccessExpires: { gt: new Date() },
        needsPasswordReset: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'INVALID_TOKEN', 'Link invalido ou expirado.', 400);
    }

    const newPasswordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        needsPasswordReset: false,
        firstAccessToken: null,
        firstAccessExpires: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'LOGIN',
        description: 'Primeira senha definida com sucesso',
      },
    });

    return successResponse(res, { message: 'Senha criada com sucesso! Voce ja pode fazer login.' });
  } catch (error) {
    console.error('Erro ao definir primeira senha:', error);
    return errorResponse(res, 'SERVER_ERROR', 'Erro interno', 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'AUTH_MISSING_FIELDS', 'Email e senha sao obrigatorios', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true },
    });

    if (!user) {
      return errorResponse(res, 'AUTH_INVALID_CREDENTIALS', 'Credenciais invalidas', 401);
    }

    if (!user.isActive) {
      if (user.subscription?.status === 'PENDING') {
        return errorResponse(res, 'AUTH_PENDING_APPROVAL', 'Seu cadastro esta aguardando aprovacao do administrador.', 403);
      }
      return errorResponse(res, 'AUTH_USER_INACTIVE', 'Sua conta foi desativada. Entre em contato com o suporte.', 401);
    }

    // Handle migrated users with no real password (MAGIC_LINK_USER)
    if (user.passwordHash === 'MAGIC_LINK_USER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PASSWORD_NOT_SET',
          message: 'Sua conta foi migrada e ainda nao possui senha definida. Use o Magic Link para entrar ou solicite um novo acesso.',
        },
        data: { needsPasswordReset: true, email: user.email },
      });
    }

    const validPassword = await comparePassword(password, user.passwordHash);
    if (!validPassword) {
      return errorResponse(res, 'AUTH_INVALID_CREDENTIALS', 'Credenciais invalidas', 401);
    }

    // Verificar se precisa resetar senha
    if (user.needsPasswordReset) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_REQUIRED',
          message: 'Voce precisa definir uma nova senha. Verifique seu email de boas-vindas.',
        },
        data: { needsPasswordReset: true },
      });
    }

    // Create session
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
        expiresAt,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.subscription?.plan || 'MENSAL',
    });

    const refreshToken = generateRefreshToken({
      sub: user.id,
      sessionId: session.id,
      type: 'refresh',
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'LOGIN',
        description: 'Login realizado',
        ipAddress: req.ip,
      },
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        plan: user.subscription?.plan || 'MENSAL',
        needsPasswordReset: user.needsPasswordReset,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'AUTH_ERROR', 'Erro ao fazer login', 500);
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await prisma.session.update({
          where: { id: payload.sessionId },
          data: { isActive: false },
        });
      } catch {}
    }

    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          type: 'LOGOUT',
          description: 'Logout realizado',
          ipAddress: req.ip,
        },
      });
    }

    res.clearCookie('refreshToken');
    return successResponse(res, { message: 'Logout realizado com sucesso' });
  } catch (error) {
    return errorResponse(res, 'LOGOUT_ERROR', 'Erro ao fazer logout', 500);
  }
};

export const me = async (req: AuthRequest, res: Response) => {
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
      role: user.role,
      avatarUrl: user.avatarUrl,
      plan: user.subscription?.plan || 'MENSAL',
      subscriptionStatus: user.subscription?.status || 'INACTIVE',
      needsPasswordReset: user.needsPasswordReset,
      language: user.language || 'pt-BR',
    });
  } catch (error) {
    return errorResponse(res, 'ME_ERROR', 'Erro ao buscar dados', 500);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return errorResponse(res, 'AUTH_NO_REFRESH', 'Refresh token nao fornecido', 401);
    }

    const payload = verifyRefreshToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: { include: { subscription: true } } },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return errorResponse(res, 'AUTH_SESSION_EXPIRED', 'Sessao expirada', 401);
    }

    const user = session.user;
    if (!user.isActive) {
      return errorResponse(res, 'AUTH_USER_INACTIVE', 'Usuario inativo', 401);
    }

    // Update session activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.subscription?.plan || 'MENSAL',
    });

    return successResponse(res, { accessToken });
  } catch (error) {
    return errorResponse(res, 'AUTH_REFRESH_ERROR', 'Erro ao renovar token', 401);
  }
};
