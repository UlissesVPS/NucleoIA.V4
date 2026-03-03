import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { PHAuthRequest } from '../middleware/prompthub-auth.middleware';

const prisma = new PrismaClient();

const generatePHToken = (userId: string, email: string): string => {
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign({ sub: userId, email, type: 'prompt_hub' }, env.JWT_SECRET, options);
};

// POST /ph/auth/register
export const register = async (req: PHAuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Email, senha e nome sao obrigatorios' } });
    }

    const existing = await prisma.promptHubUser.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Este email ja esta cadastrado no Prompt Hub' } });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.promptHubUser.create({
      data: {
        email,
        passwordHash,
        name,
        paidAt: new Date(),
      },
    });

    const token = generatePHToken(user.id, user.email);

    return res.status(201).json({
      success: true,
      data: {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          language: user.language,
          theme: user.theme,
        },
      },
    });
  } catch (error) {
    console.error('PH Register error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro interno do servidor' } });
  }
};

// POST /ph/auth/login
export const login = async (req: PHAuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Email e senha sao obrigatorios' } });
    }

    const user = await prisma.promptHubUser.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciais invalidas' } });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: { code: 'ACCOUNT_INACTIVE', message: 'Conta desativada' } });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciais invalidas' } });
    }

    const token = generatePHToken(user.id, user.email);

    return res.json({
      success: true,
      data: {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          language: user.language,
          theme: user.theme,
        },
      },
    });
  } catch (error) {
    console.error('PH Login error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro interno do servidor' } });
  }
};

// GET /ph/auth/me
export const getMe = async (req: PHAuthRequest, res: Response) => {
  try {
    const user = await prisma.promptHubUser.findUnique({ where: { id: req.phUser!.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Usuario nao encontrado' } });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        language: user.language,
        theme: user.theme,
        paidAt: user.paidAt,
      },
    });
  } catch (error) {
    console.error('PH GetMe error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erro interno do servidor' } });
  }
};
