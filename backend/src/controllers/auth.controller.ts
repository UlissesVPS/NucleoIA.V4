import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { env } from '../config/env';
import { sendEmail } from '../services/email.service';

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
        isActive: true,
        needsPasswordReset: false,
      },
    });

    // Create MENSAL subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'MENSAL',
        status: 'ACTIVE',
        planTier: 'DIAMANTE',
      },
    });

    // Log the registration
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        description: 'Cadastro realizado com sucesso',
        ipAddress: req.ip,
      },
    });

    console.log(`[REGISTER] New user registered: ${user.email} (${user.id})`);

    return successResponse(res, {
      message: 'Cadastro realizado com sucesso! Voce ja pode fazer login.',
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

    if (!password || password.length < 6) {
      return errorResponse(res, 'INVALID_PASSWORD', 'A senha deve ter no minimo 6 caracteres', 400);
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
      // Auto-activate if user has a valid (non-expired) subscription
      const hasValidSubscription = user.subscription &&
        user.subscription.expiresAt &&
        new Date(user.subscription.expiresAt) > new Date();

      if (hasValidSubscription) {
        // Auto-activate the user - they have a valid subscription
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: true },
        });
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            type: 'SYSTEM',
            description: 'Conta auto-ativada no login (assinatura valida detectada)',
            ipAddress: req.ip,
          },
        });
        console.log(`[LOGIN] Auto-activated user: ${user.email} (valid subscription until ${user.subscription!.expiresAt})`);
        // Continue with login - don't return error
      } else if (user.subscription?.status === 'PENDING') {
        return errorResponse(res, 'AUTH_PENDING_APPROVAL', 'Seu cadastro esta aguardando aprovacao do administrador.', 403);
      } else {
        return errorResponse(res, 'AUTH_USER_INACTIVE', 'Sua conta esta inativa. Entre em contato com o suporte.', 401);
      }
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
      planTier: user.subscription?.planTier || 'DIAMANTE',
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

// ==================== FORGOT PASSWORD (PUBLIC) ====================
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return errorResponse(res, 'MISSING_EMAIL', 'O email e obrigatorio', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { subscription: true },
    });

    // Security: always return success to avoid email enumeration
    if (!user) {
      console.log(`[FORGOT_PASSWORD] Attempt for non-existent email: ${email.trim().toLowerCase()}`);
      return successResponse(res, { message: 'Se o email estiver cadastrado, voce recebera um link de recuperacao.' });
    }

    // Generate secure token
    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    // Send email
    const resetUrl = `https://painel.nucleoia.online/redefinir-senha?token=${token}`;
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Recuperacao de Senha - Nucleo IA',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 40px 30px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #F97316; font-size: 28px; margin: 0;">NUCLEO IA</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Recuperacao de Senha</p>
          </div>
          <div style="background: #16213e; border-radius: 12px; padding: 30px; border: 1px solid #2a2a4a;">
            <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 10px;">
              Ola, <strong>${user.name?.split(' ')[0] || 'Membro'}</strong>!
            </p>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Recebemos uma solicitacao para redefinir a senha da sua conta.
              Clique no botao abaixo para criar uma nova senha:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="display: inline-block; background: linear-gradient(135deg, #F97316, #ea580c); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Redefinir Minha Senha
              </a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
              Este link expira em <strong style="color: #94a3b8;">1 hora</strong>.
              Se voce nao solicitou essa alteracao, ignore este email.
            </p>
            <hr style="border: none; border-top: 1px solid #2a2a4a; margin: 24px 0;" />
            <p style="color: #475569; font-size: 12px; margin: 0;">
              Se o botao nao funcionar, copie e cole este link no navegador:<br/>
              <a href="${resetUrl}" style="color: #F97316; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          <p style="text-align: center; color: #475569; font-size: 12px; margin-top: 24px;">
            &copy; ${new Date().getFullYear()} Nucleo IA. Todos os direitos reservados.
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error(`[FORGOT_PASSWORD] Email send FAILED for: ${user.email} | Error: ${emailResult.error}`);
      // Limpar token se email falhou (evita token orfao)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpires: null },
      });
      return errorResponse(res, 'EMAIL_SEND_FAILED', 'Nao foi possivel enviar o email de recuperacao. Tente novamente em alguns minutos ou entre em contato com o suporte.', 503);
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        description: `Recuperacao de senha solicitada (email: ${emailResult.messageId || 'sent'})`,
        ipAddress: req.ip,
      },
    });

    console.log(`[FORGOT_PASSWORD] Reset email sent to: ${user.email} | MessageId: ${emailResult.messageId}`);
    return successResponse(res, { message: 'Email de recuperacao enviado! Verifique sua caixa de entrada e a pasta de spam.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 'FORGOT_PASSWORD_ERROR', 'Erro ao processar solicitacao. Tente novamente.', 500);
  }
};

// ==================== VALIDATE RESET TOKEN (PUBLIC) ====================
export const validateResetToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return errorResponse(res, 'INVALID_TOKEN', 'Link invalido ou expirado.', 400);
    }

    return successResponse(res, { valid: true, email: user.email });
  } catch (error) {
    console.error('Validate reset token error:', error);
    return errorResponse(res, 'SERVER_ERROR', 'Erro interno', 500);
  }
};

// ==================== RESET PASSWORD (PUBLIC) ====================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return errorResponse(res, 'INVALID_PASSWORD', 'A senha deve ter no minimo 6 caracteres', 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return errorResponse(res, 'INVALID_TOKEN', 'Link invalido ou expirado. Solicite uma nova recuperacao.', 400);
    }

    const newPasswordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        needsPasswordReset: false,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        description: 'Senha redefinida com sucesso via recuperacao',
        ipAddress: req.ip,
      },
    });

    console.log(`[RESET_PASSWORD] Password reset for: ${user.email}`);
    return successResponse(res, { message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 'RESET_PASSWORD_ERROR', 'Erro ao redefinir senha. Tente novamente.', 500);
  }
};
