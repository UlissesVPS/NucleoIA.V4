import prisma from '../config/database';
import { hashPassword } from '../utils/hash';
import { sendEmail } from './email.service';
import crypto from 'crypto';

const DEFAULT_PASSWORD = '@Nucleo2026';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://painel.nucleoia.online';

interface GreennClient {
  id?: number;
  name?: string;
  email: string;
  cellphone?: string;
}

interface GreennContract {
  id?: number;
  status?: string;
  start_date?: string;
  current_period_end?: string;
}

interface GreennSale {
  id?: number;
  status?: string;
  amount?: number;
}

export async function handleContractEvent(
  currentStatus: string,
  oldStatus: string,
  client: GreennClient,
  contract: GreennContract | null
) {
  console.log(`[Webhook] Contrato: ${oldStatus} -> ${currentStatus} | ${client.email}`);

  switch (currentStatus) {
    case 'paid':
    case 'trialing':
      await createOrActivateUser(client, contract);
      break;
    case 'canceled':
    case 'unpaid':
      await suspendUser(client.email, currentStatus.toUpperCase());
      break;
    case 'pending_payment':
      console.log(`[Webhook] Aguardando pagamento: ${client.email}`);
      break;
  }
}

export async function handleSaleEvent(
  currentStatus: string,
  oldStatus: string,
  client: GreennClient,
  sale: GreennSale | null
) {
  console.log(`[Webhook] Venda: ${oldStatus} -> ${currentStatus} | ${client.email}`);

  switch (currentStatus) {
    case 'paid':
      await createOrActivateUser(client, null);
      break;
    case 'refunded':
    case 'chargedback':
      await suspendUser(client.email, currentStatus.toUpperCase());
      break;
  }
}

async function createOrActivateUser(client: GreennClient, contract: GreennContract | null) {
  const email = client.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  const expiresAt = contract?.current_period_end
    ? new Date(contract.current_period_end)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias default

  // Calcular periodo baseado na duracao
  const now = new Date();
  const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let calculatedPlan: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' = 'MENSAL';
  if (diffDays > 120) calculatedPlan = 'SEMESTRAL';
  else if (diffDays > 55) calculatedPlan = 'TRIMESTRAL';

  if (existingUser) {
    console.log(`[Webhook] Usuario existe: ${email}, reativando...`);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { isActive: true },
    });

    // Upsert subscription
    if (existingUser.subscription) {
      await prisma.subscription.update({
        where: { id: existingUser.subscription.id },
        data: {
          status: 'ACTIVE',
          plan: calculatedPlan,
          expiresAt,
          paymentGateway: 'GREENN',
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
          paymentGateway: 'GREENN',
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: existingUser.id,
        type: 'SYSTEM',
        description: 'Acesso reativado via webhook Greenn',
        metadata: { greennClientId: client.id },
      },
    });

    console.log(`[Webhook] Usuario reativado: ${email}`);
    return;
  }

  // Criar novo usuario
  console.log(`[Webhook] Criando usuario: ${email}`);

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  const firstAccessToken = crypto.randomBytes(32).toString('hex');
  const firstAccessExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  const newUser = await prisma.user.create({
    data: {
      email,
      name: client.name || email.split('@')[0],
      passwordHash,
      role: 'MEMBER',
      isActive: true,
      needsPasswordReset: true,
      firstAccessToken,
      firstAccessExpires,
      greennClientId: client.id?.toString() || null,
      subscription: {
        create: {
          status: 'ACTIVE',
          plan: calculatedPlan,
          startedAt: new Date(),
          expiresAt,
          paymentGateway: 'GREENN',
        },
      },
    },
  });

  console.log(`[Webhook] Usuario criado: ${email} (ID: ${newUser.id})`);

  // Enviar email de boas-vindas
  await sendWelcomeEmail(email, client.name || '', firstAccessToken);
}

async function suspendUser(email: string, reason: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { subscription: true },
  });

  if (!user) {
    console.log(`[Webhook] Usuario nao encontrado para suspender: ${normalizedEmail}`);
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
      description: `Acesso suspenso via webhook Greenn: ${reason}`,
      metadata: { reason },
    },
  });

  console.log(`[Webhook] Usuario suspenso: ${normalizedEmail} (motivo: ${reason})`);
}

async function sendWelcomeEmail(email: string, name: string, token: string) {
  const firstName = name?.split(' ')[0] || 'Membro';
  const accessLink = `${FRONTEND_URL}/primeiro-acesso?token=${token}`;

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
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Bem-vindo ao Nucleo IA!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                Sua jornada no mundo da Inteligencia Artificial comeca agora
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;">
                Ola, <strong>${firstName}</strong>!
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Sua compra foi aprovada e seu acesso a plataforma <strong>Nucleo IA</strong> esta liberado!
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Clique no botao abaixo para <strong>criar sua senha</strong> e comecar a explorar todas as ferramentas de IA:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="${accessLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                      Criar Minha Senha e Acessar
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <h3 style="color: #166534; margin: 0 0 16px 0; font-size: 16px;">
                  O que voce vai encontrar na plataforma:
                </h3>
                <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li><strong>17 Ferramentas de IA</strong> para texto, imagem, video e muito mais</li>
                  <li><strong>Biblioteca de Prompts</strong> prontos para usar</li>
                  <li><strong>Cursos Exclusivos</strong> para dominar as IAs</li>
                  <li><strong>Produtos Digitais</strong> com desconto especial</li>
                  <li><strong>Comunidade</strong> de criadores como voce</li>
                </ul>
              </div>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Importante:</strong> Este link e valido por <strong>7 dias</strong> e so pode ser usado uma vez. Apos criar sua senha, voce fara login normalmente com email e senha.
                </p>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Se o botao nao funcionar, copie e cole este link no navegador:<br>
                <a href="${accessLink}" style="color: #10b981; word-break: break-all;">${accessLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                2026 Nucleo IA - Todos os direitos reservados
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Duvidas? Entre em contato: suporte@nucleoia.online
              </p>
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
    console.log(`[Webhook] Email de boas-vindas enviado para: ${email}`);
  } catch (error) {
    console.error(`[Webhook] Erro ao enviar email para ${email}:`, error);
  }
}
