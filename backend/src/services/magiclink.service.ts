import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

interface MagicLinkConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  frontendUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
}

const config: MagicLinkConfig = {
  smtpHost: process.env.SMTP_HOST || 'smtp.hostinger.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465'),
  smtpUser: process.env.SMTP_USER || 'seuacesso@nucleoia.online',
  smtpPass: process.env.SMTP_PASS || '@Nucleo1020',
  fromEmail: process.env.FROM_EMAIL || 'seuacesso@nucleoia.online',
  frontendUrl: process.env.FRONTEND_URL || 'https://painel.nucleoia.online',
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
};

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: true,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

export async function sendMagicLink(email: string): Promise<{ success: boolean; message: string; code?: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { subscription: true },
  });

  if (!user) {
    return {
      success: false,
      code: 'EMAIL_NOT_REGISTERED',
      message: 'Este e-mail nao esta cadastrado. Use o mesmo e-mail da sua compra na Green.',
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      code: 'ACCOUNT_INACTIVE',
      message: 'Sua conta esta inativa. Entre em contato com o suporte.',
    };
  }

  if (!user.subscription || !['ACTIVE', 'PENDING'].includes(user.subscription.status)) {
    return {
      success: false,
      code: 'NO_ACTIVE_SUBSCRIPTION',
      message: 'Voce nao possui uma assinatura ativa. Adquira seu acesso em nucleoia.online',
    };
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  // Salvar token na sessao temporaria
  await prisma.session.create({
    data: {
      userId: user.id,
      token: token,
      ip: 'magic-link-pending',
      isActive: false,
      expiresAt: expiresAt,
    },
  });

  const magicLink = `${config.frontendUrl}/auth/magic?token=${token}`;

  await transporter.sendMail({
    from: `"Nucleo IA" <${config.fromEmail}>`,
    to: email,
    subject: 'Seu link de acesso - Nucleo IA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Ola, ${user.name}!</h2>
        <p>Voce solicitou acesso ao Nucleo IA. Clique no botao abaixo para entrar:</p>
        <a href="${magicLink}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Acessar Nucleo IA
        </a>
        <p style="color: #666; font-size: 14px;">Este link expira em 15 minutos.</p>
        <p style="color: #666; font-size: 14px;">Se voce nao solicitou este acesso, ignore este email.</p>
      </div>
    `,
  });

  return { success: true, message: 'Link de acesso enviado para seu email!' };
}

export async function verifyMagicLink(token: string, ip: string, userAgent?: string): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  message?: string;
}> {
  const session = await prisma.session.findFirst({
    where: {
      token: token,
      ip: 'magic-link-pending',
      isActive: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: { subscription: true },
      },
    },
  });

  if (!session) {
    return { success: false, message: 'Link invalido ou expirado.' };
  }

  // Ativar sessao
  await prisma.session.update({
    where: { id: session.id },
    data: {
      ip: ip,
      userAgent: userAgent,
      isActive: true,
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    },
  });

  const accessToken = jwt.sign(
    {
      sub: session.userId,
      email: session.user.email,
      role: session.user.role,
      plan: session.user.subscription?.plan || 'MENSAL',
    },
    config.jwtSecret,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { sub: session.userId, sessionId: session.id, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: '7d' }
  );

  // Log de atividade
  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      type: 'LOGIN',
      description: 'Login via Magic Link',
      ipAddress: ip,
    },
  });

  return {
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      avatarUrl: session.user.avatarUrl,
      subscription: session.user.subscription,
    },
  };
}
