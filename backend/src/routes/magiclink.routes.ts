import { Router } from 'express';
import { sendMagicLink, verifyMagicLink } from '../services/magiclink.service';

const router = Router();

router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email é obrigatório' } });
    }
    const result = await sendMagicLink(email);
    res.json(result);
  } catch (error) {
    console.error('Magic link error:', error);
    res.status(500).json({ success: false, error: { message: 'Erro ao enviar link' } });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    if (!token) {
      return res.status(400).json({ success: false, error: { message: 'Token é obrigatório' } });
    }

    const result = await verifyMagicLink(token, ip, userAgent);

    if (result.success && result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Verify magic link error:', error);
    res.status(500).json({ success: false, error: { message: 'Erro ao verificar link' } });
  }
});

export default router;
