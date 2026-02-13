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
    console.log('[Webhook] Lastlink recebido:', JSON.stringify(req.body, null, 2));

    const body = req.body;

    // Validar que temos dados do comprador
    const buyer = body.buyer || body.customer || body.client || {};
    if (!buyer.email) {
      console.log('[Webhook] Sem email do comprador, ignorando');
      return res.status(200).json({ success: true, message: 'Ignorado - sem email' });
    }

    await handleLastlinkEvent(body);

    return res.status(200).json({ success: true, message: 'Webhook processado' });
  } catch (error) {
    console.error('[Webhook] Erro Lastlink:', error);
    // Sempre retornar 200 para a Lastlink nao reenviar
    return res.status(200).json({ success: false, message: 'Erro interno' });
  }
});

export default router;
