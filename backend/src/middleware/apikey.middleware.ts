import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { errorResponse } from '../utils/response';

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string;
    name: string;
    type: string;
    permissions: string[];
  };
}

/**
 * Middleware that authenticates requests using API keys.
 * Accepts key via X-API-Key header or Authorization: ApiKey <key>
 */
export const apiKeyMiddleware = async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  try {
    // Extract API key from headers
    let rawKey = req.headers['x-api-key'] as string;

    if (!rawKey) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('ApiKey ')) {
        rawKey = authHeader.slice(7);
      }
    }

    if (!rawKey) {
      return errorResponse(res, 'API_KEY_MISSING', 'API key nao fornecida. Use header X-API-Key ou Authorization: ApiKey <key>', 401);
    }

    // Validate key format
    if (!rawKey.startsWith('nuc_')) {
      return errorResponse(res, 'API_KEY_INVALID', 'Formato de API key invalido', 401);
    }

    // Find all active, non-expired keys
    const activeKeys = await prisma.apiKey.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    // Compare key against each stored hash
    let matchedKey: (typeof activeKeys)[number] | null = null;
    for (const key of activeKeys) {
      const isMatch = await bcrypt.compare(rawKey, key.keyHash);
      if (isMatch) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      return errorResponse(res, 'API_KEY_INVALID', 'API key invalida ou expirada', 401);
    }

    // Attach API key info to request
    req.apiKey = {
      id: matchedKey.id,
      name: matchedKey.name,
      type: matchedKey.type,
      permissions: (matchedKey.permissions as string[]) || [],
    };

    next();
  } catch (error) {
    return errorResponse(res, 'API_KEY_ERROR', 'Erro ao validar API key', 500);
  }
};

/**
 * Permission check middleware - use after apiKeyMiddleware
 */
export const requirePermission = (permission: string) => {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return errorResponse(res, 'API_KEY_MISSING', 'API key nao autenticada', 401);
    }

    // Allow if permissions array is empty (full access) or contains the required permission
    const perms = req.apiKey.permissions;
    if (perms.length === 0 || perms.includes('*') || perms.includes(permission)) {
      return next();
    }

    return errorResponse(res, 'API_KEY_FORBIDDEN', `Permissao '${permission}' nao concedida para esta API key`, 403);
  };
};
