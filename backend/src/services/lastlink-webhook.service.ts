import prisma from '../config/database';
import { hashPassword } from '../utils/hash';
import { sendEmail } from './email.service';
import crypto from 'crypto';

const DEFAULT_PASSWORD = '@Nucleo2026';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://painel.nucleoia.online';

/**
 * Lastlink Webhook Service
 * Processa eventos recebidos da plataforma Lastlink.
 *
 * Eventos suportados:
 * - Purchase_Order_Confirmed (compra aprovada)
 * - Recurrent_Payment (renovacao de assinatura)
 * - Subscription_Canceled (cancelamento)
 * - Subscription_Expired (expiracao por falta de pagamento)
 * - Payment_Refund (reembolso)
 * - Payment_Chargeback (chargeback)
 * - Product_access_started (acesso liberado)
 * - Product_access_ended (acesso removido)
 */

interface LastlinkBuyer {
  name?: string;
  email: string;
  phone?: string;
  document?: string;
}

interface LastlinkPayment {
  method?: string; // credit_card, pix, bankslip
  amount?: number;
  installments?: number;
}

interface LastlinkSubscription {
  id?: string;
  status?: string;
  start_date?: string;
  next_billing_date?: string;
}

interface LastlinkProduct {
  id?: string;
  name?: string;
}

export async function handleLastlinkEvent(body: any) {
  const event = body.event || body.type || body.webhook_event;
  const buyer: LastlinkBuyer = body.buyer || body.customer || body.client || {};
  const payment: LastlinkPayment = body.payment || {};
  const subscription: LastlinkSubscription = body.subscription || {};
  const product: LastlinkProduct = body.product || {};

  const email = buyer.email?.toLowerCase?.()?.trim?.();

  if (!email) {
    console.log('[Lastlink] Sem email do comprador, ignorando');
    return;
  }

  console.log(`[Lastlink] Evento: ${event} | Email: ${email} | Produto: ${product.name || 'N/A'}`);

  // Log no activity log
  await prisma.activityLog.create({
    data: {
      type: 'SYSTEM',
      description: `Webhook Lastlink recebido: ${event} - ${email}`,
      metadata: { event, email, product: product.name, raw: body },
    },
  }).catch(() => {});

  switch (event) {
    case 'Purchase_Order_Confirmed':
    case 'Recurrent_Payment':
    case 'Product_access_started':
      await activateUser(buyer, subscription);
      break;

    case 'Subscription_Canceled':
    case 'Subscription_Expired':
    case 'Payment_Refund':
    case 'Payment_Chargeback':
    case 'Product_access_ended':
    case 'Purchase_Request_Canceled':
      await suspendUser(email, event);
      break;

    case 'Abandoned_Cart':
    case 'Purchase_Request_Confirmed':
    case 'Purchase_Request_Expired':
    case 'Refund_Period_Over':
    case 'Subscription_Renewal_Pending':
    case 'Active_Member_Notification':
    case 'Refund_Requested':
      console.log(`[Lastlink] Evento informativo: ${event} - ${email}`);
      break;

    default:
      console.log(`[Lastlink] Evento nao tratado: ${event}`);
  }
}

async function activateUser(buyer: LastlinkBuyer, subscription: LastlinkSubscription) {
  const email = buyer.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  // Calcular expiracao
  let expiresAt: Date;
  if (subscription.next_billing_date) {
    expiresAt = new Date(subscription.next_billing_date);
  } else {
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias default
  }

  // Calcular plano baseado na duracao
  const now = new Date();
  const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let calculatedPlan: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' = 'MENSAL';
  if (diffDays > 120) calculatedPlan = 'SEMESTRAL';
  else if (diffDays > 55) calculatedPlan = 'TRIMESTRAL';

  if (existingUser) {
    console.log(`[Lastlink] Usuario existe: ${email}, reativando...`);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { isActive: true },
    });

    if (existingUser.subscription) {
      await prisma.subscription.update({
        where: { id: existingUser.subscription.id },
        data: {
          status: 'ACTIVE',
          plan: calculatedPlan,
          expiresAt,
          paymentGateway: 'LASTLINK',
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: existingUser.id,
          status: 'ACTIVE',
          plan: calculatedPlan,
          startedAt: new Date(),
          expiresAt,
          paymentGateway: 'LASTLINK',
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: existingUser.id,
        type: 'SYSTEM',
        description: 'Acesso reativado via webhook Lastlink',
        metadata: { subscriptionId: subscription.id },
      },
    });

    console.log(`[Lastlink] Usuario reativado: ${email}`);
    return;
  }

  // Criar novo usuario
  console.log(`[Lastlink] Criando usuario: ${email}`);

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  const firstAccessToken = crypto.randomBytes(32).toString('hex');
  const firstAccessExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const newUser = await prisma.user.create({
    data: {
      email,
      name: buyer.name || email.split('@')[0],
      passwordHash,
      role: 'MEMBER',
      isActive: true,
      needsPasswordReset: true,
      firstAccessToken,
      firstAccessExpires,
      subscription: {
        create: {
          status: 'ACTIVE',
          plan: calculatedPlan,
          startedAt: new Date(),
          expiresAt,
          paymentGateway: 'LASTLINK',
        },
      },
    },
  });

  console.log(`[Lastlink] Usuario criado: ${email} (ID: ${newUser.id})`);

  await sendWelcomeEmail(email, buyer.name || '');
}

async function suspendUser(email: string, reason: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  if (!user) {
    console.log(`[Lastlink] Usuario nao encontrado para suspender: ${email}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: false },
  });

  if (user.subscription) {
    await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: { status: 'CANCELED' },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      type: 'SUSPEND',
      description: `Acesso suspenso via webhook Lastlink: ${reason}`,
      metadata: { reason },
    },
  });

  console.log(`[Lastlink] Usuario suspenso: ${email} (motivo: ${reason})`);
}

async function sendWelcomeEmail(email: string, name: string) {
  const firstName = name?.split(' ')[0] || 'Membro';

  // Reutiliza o mesmo template da Greenn - gera token de primeiro acesso
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.firstAccessToken) return;

  const accessLink = `${FRONTEND_URL}/primeiro-acesso?token=${user.firstAccessToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Bem-vindo ao Nucleo IA!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sua jornada no mundo da Inteligencia Artificial comeca agora</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;">Ola, <strong>${firstName}</strong>!</p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Sua compra foi aprovada e seu acesso a plataforma <strong>Nucleo IA</strong> esta liberado!</p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Clique no botao abaixo para <strong>criar sua senha</strong> e comecar a explorar:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="${accessLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">Criar Minha Senha e Acessar</a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>Importante:</strong> Este link e valido por <strong>7 dias</strong>.</p>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">Se o botao nao funcionar, copie e cole este link:<br><a href="${accessLink}" style="color: #10b981; word-break: break-all;">${accessLink}</a></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">2026 Nucleo IA - suporte@nucleoia.online</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await sendEmail({
      to: email,
      subject: 'Bem-vindo ao Nucleo IA! Crie sua senha e comece agora',
      html,
    });
    console.log(`[Lastlink] Email de boas-vindas enviado para: ${email}`);
  } catch (error) {
    console.error(`[Lastlink] Erro ao enviar email para ${email}:`, error);
  }
}
