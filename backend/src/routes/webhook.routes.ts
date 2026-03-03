import { Router, Request, Response } from 'express';
import {
  handleContractEvent,
  handleSaleEvent,
} from '../services/greenn-webhook.service';
import { handleLastlinkEvent } from '../services/lastlink-webhook.service';

const router = Router();

// POST /api/webhooks/green
router.post('/green', async (req: Request, res: Response) => {
  try {
    console.log('[Webhook] Greenn recebido:', JSON.stringify(req.body, null, 2));

    const { type, event, currentStatus, oldStatus, client, contract, sale } = req.body;

    // Ignore internal webhook dispatches (they have 'event' but no client data)
    if (!type && !client?.email && req.body.event) {
      console.log('[Webhook] Ignorando dispatch interno Greenn (nao e da Greenn real)');
      return res.status(200).json({ success: true, message: 'Dispatch interno ignorado' });
    }

    // Validar que temos dados do cliente
    if (!client?.email) {
      console.log('[Webhook] Sem email do cliente, ignorando');
      return res.status(200).json({ success: true, message: 'Ignorado - sem email' });
    }

    if (type === 'contract') {
      await handleContractEvent(currentStatus, oldStatus, client, contract);
    } else if (type === 'sale') {
      await handleSaleEvent(currentStatus, oldStatus, client, sale);
    } else {
      console.log(`[Webhook] Tipo nao tratado: ${type}, event: ${event}`);
    }

    return res.status(200).json({ success: true, message: 'Webhook processado' });
  } catch (error) {
    console.error('[Webhook] Erro:', error);
    // Sempre retornar 200 para a Greenn nao reenviar
    return res.status(200).json({ success: false, message: 'Erro interno' });
  }
});

// POST /api/webhooks/lastlink
router.post('/lastlink', async (req: Request, res: Response) => {
  try {
    const raw = req.body;
    console.log('[Webhook] Lastlink recebido:', JSON.stringify(raw, null, 2));

    // Ignore internal webhook dispatches (they have lowercase 'event' and no buyer data)
    if (raw.event && !raw.Event && !raw.Data) {
      console.log('[Webhook] Ignorando dispatch interno (nao e da Lastlink real)');
      return res.status(200).json({ success: true, message: 'Dispatch interno ignorado' });
    }

    // Normalize Lastlink PascalCase payload to camelCase
    // Lastlink sends: { Event, Data: { Buyer: { Email }, Purchase: { NextBilling }, Products } }
    // Our service expects: { event, buyer: { email, name }, subscription: { next_billing_date }, product: { name } }
    const data = raw.Data || raw.data || {};
    const buyer = data.Buyer || data.buyer || raw.buyer || raw.customer || raw.client || {};
    const purchase = data.Purchase || data.purchase || {};
    const products = data.Products || data.products || [];
    const subscription = raw.subscription || {};

    const normalizedBody = {
      event: raw.Event || raw.event || raw.type || raw.webhook_event,
      buyer: {
        name: buyer.Name || buyer.name || null,
        email: buyer.Email || buyer.email || null,
        phone: buyer.PhoneNumber || buyer.Phone || buyer.phone || null,
        document: buyer.Document || buyer.document || null,
      },
      subscription: {
        id: subscription.id || null,
        status: subscription.status || null,
        start_date: subscription.start_date || null,
        next_billing_date: purchase.NextBilling || purchase.nextBilling || subscription.next_billing_date || null,
      },
      product: {
        id: products[0]?.Id || products[0]?.id || null,
        name: products[0]?.Name || products[0]?.name || null,
      },
      payment: {
        method: purchase.PaymentMethod || purchase.paymentMethod || null,
        amount: purchase.Price?.Value || purchase.price?.value || products[0]?.Price || null,
      },
      _raw: raw, // Keep raw for debugging
    };

    if (!normalizedBody.buyer.email) {
      console.log('[Webhook] Sem email do comprador no payload Lastlink, ignorando');
      return res.status(200).json({ success: true, message: 'Ignorado - sem email' });
    }

    console.log(`[Webhook] Lastlink normalizado: event=${normalizedBody.event}, email=${normalizedBody.buyer.email}, nextBilling=${normalizedBody.subscription.next_billing_date}`);

    await handleLastlinkEvent(normalizedBody);

    return res.status(200).json({ success: true, message: 'Webhook processado' });
  } catch (error) {
    console.error('[Webhook] Erro Lastlink:', error);
    // Sempre retornar 200 para a Lastlink nao reenviar
    return res.status(200).json({ success: false, message: 'Erro interno' });
  }
});

export default router;
