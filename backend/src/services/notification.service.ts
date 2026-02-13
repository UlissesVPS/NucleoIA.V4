import prisma from '../config/database';
import { sendEmail } from './email.service';

type NotificationType = 'NEW_COURSE' | 'NEW_PROMPT' | 'UPDATE' | 'MARKETING';

interface NotifyOptions {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// Map notification types to user preference fields
const typeToField: Record<NotificationType, string> = {
  NEW_COURSE: 'notifyNewCourse',
  NEW_PROMPT: 'notifyNewPrompt',
  UPDATE: 'notifyUpdates',
  MARKETING: 'notifyMarketing',
};

export async function notifyMembers(options: NotifyOptions) {
  const { type, title, message, link } = options;
  const field = typeToField[type];

  if (!field) return { sent: 0, total: 0 };

  try {
    // Find all active users who want this notification type AND have email notifications enabled
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        notifyEmail: true,
        [field]: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        language: true,
      },
    });

    if (users.length === 0) return { sent: 0, total: 0 };

    const baseUrl = process.env.FRONTEND_URL || 'https://painel.nucleoia.online';
    const fullLink = link ? `${baseUrl}${link}` : baseUrl;

    let sent = 0;
    const batchSize = 10;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((user) =>
          sendEmail({
            to: user.email,
            subject: getSubject(type, title, user.language || 'pt-BR'),
            html: buildEmailHtml(type, title, message, fullLink, user.name, user.language || 'pt-BR'),
          })
        )
      );

      sent += results.filter((r) => r.status === 'fulfilled').length;
    }

    // Log notification
    console.log(`[NOTIFICATION] Type: ${type}, Title: "${title}", Sent: ${sent}/${users.length}`);

    return { sent, total: users.length };
  } catch (error) {
    console.error('[NOTIFICATION ERROR]', error);
    return { sent: 0, total: 0 };
  }
}

function getSubject(type: NotificationType, title: string, lang: string): string {
  const prefixes: Record<string, Record<NotificationType, string>> = {
    'pt-BR': {
      NEW_COURSE: 'Novo curso disponivel',
      NEW_PROMPT: 'Novos prompts adicionados',
      UPDATE: 'Novidades na plataforma',
      MARKETING: 'Oferta especial',
    },
    en: {
      NEW_COURSE: 'New course available',
      NEW_PROMPT: 'New prompts added',
      UPDATE: 'Platform updates',
      MARKETING: 'Special offer',
    },
    es: {
      NEW_COURSE: 'Nuevo curso disponible',
      NEW_PROMPT: 'Nuevos prompts agregados',
      UPDATE: 'Novedades en la plataforma',
      MARKETING: 'Oferta especial',
    },
  };

  const prefix = prefixes[lang]?.[type] || prefixes['pt-BR'][type];
  return `${prefix}: ${title}`;
}

function buildEmailHtml(
  type: NotificationType,
  title: string,
  message: string,
  link: string,
  userName: string,
  lang: string
): string {
  const firstName = userName?.split(' ')[0] || 'Membro';

  const buttonText: Record<string, string> = {
    'pt-BR': 'Acessar Plataforma',
    en: 'Access Platform',
    es: 'Acceder a la Plataforma',
  };

  const footerText: Record<string, string> = {
    'pt-BR': 'Voce recebeu este email porque esta inscrito na Nucleo IA. Para ajustar suas notificacoes, acesse Configuracoes no painel.',
    en: 'You received this email because you are subscribed to Nucleo IA. To adjust your notifications, go to Settings in the dashboard.',
    es: 'Recibiste este correo porque estas suscrito en Nucleo IA. Para ajustar tus notificaciones, accede a Configuracion en el panel.',
  };

  const btn = buttonText[lang] || buttonText['pt-BR'];
  const footer = footerText[lang] || footerText['pt-BR'];

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0e0e10;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#f97316;font-size:24px;margin:0;">NUCLEO IA</h1>
    </div>
    <div style="background:#1a1a1e;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.06);">
      <p style="color:#999;font-size:14px;margin:0 0 8px;">Ola, ${firstName}!</p>
      <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">${title}</h2>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 24px;">${message}</p>
      <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#a855f7);color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px;">${btn}</a>
    </div>
    <p style="color:#666;font-size:11px;text-align:center;margin-top:24px;line-height:1.5;">${footer}</p>
  </div>
</body>
</html>`;
}
