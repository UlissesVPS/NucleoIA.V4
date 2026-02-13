import prisma from '../config/database';
import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

/**
 * Fire webhook event to all active webhooks matching the event name.
 * This is fire-and-forget - it does NOT block the caller.
 */
export const fireWebhookEvent = (event: string, data: any): void => {
  // Fire and forget - don't await
  dispatchWebhooks(event, data).catch((err) => {
    console.error(`[Webhook] Error dispatching event ${event}:`, err.message);
  });
};

async function dispatchWebhooks(event: string, data: any): Promise<void> {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { event, status: 'ACTIVE' },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const body = JSON.stringify(payload);

    const results = await Promise.allSettled(
      webhooks.map((webhook) => sendWebhook(webhook, body))
    );

    // Log summary
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (succeeded > 0 || failed > 0) {
      console.log(
        `[Webhook] Event "${event}" dispatched: ${succeeded} ok, ${failed} failed`
      );
    }
  } catch (err: any) {
    console.error(`[Webhook] Failed to dispatch "${event}":`, err.message);
  }
}

async function sendWebhook(
  webhook: { id: string; url: string; secret: string; headers: any; failures: number },
  body: string
): Promise<void> {
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(body)
    .digest('hex');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': webhook.secret,
    'X-Webhook-Signature': `sha256=${signature}`,
    'User-Agent': 'NucleoIA-Webhook/1.0',
  };

  // Merge custom headers
  if (webhook.headers && typeof webhook.headers === 'object') {
    const customHeaders = webhook.headers as Record<string, string>;
    for (const [key, value] of Object.entries(customHeaders)) {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const statusCode = response.status;
    const isOk = response.ok;

    // Update webhook status
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastFired: new Date(),
        lastStatus: statusCode,
        failures: isOk ? 0 : { increment: 1 },
        status: !isOk && webhook.failures >= 9 ? 'ERROR' : undefined,
      },
    });

    // Log the dispatch
    await prisma.activityLog.create({
      data: {
        type: 'SYSTEM',
        description: `Webhook "${webhook.url}" disparado - Status: ${statusCode}`,
        metadata: {
          webhookId: webhook.id,
          statusCode,
          ok: isOk,
        },
      },
    }).catch(() => {}); // Don't fail if log fails

    if (!isOk) {
      throw new Error(`Webhook returned ${statusCode}`);
    }
  } catch (err: any) {
    // On error, increment failures
    if (!err.message?.includes('Webhook returned')) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          lastFired: new Date(),
          lastStatus: 0,
          failures: { increment: 1 },
          status: webhook.failures >= 9 ? 'ERROR' : undefined,
        },
      }).catch(() => {});

      await prisma.activityLog.create({
        data: {
          type: 'SYSTEM',
          description: `Webhook "${webhook.url}" falhou - ${err.message}`,
          metadata: {
            webhookId: webhook.id,
            error: err.message,
          },
        },
      }).catch(() => {});
    }

    throw err;
  }
}
