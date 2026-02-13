import { Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getPageSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { page } = req.params;

    const settings = await prisma.pageSettings.findUnique({
      where: { page },
    });

    return successResponse(res, settings || {
      coverImageUrl: null,
      bannerTitle: null,
      bannerSubtitle: null,
      useFeaturedFallback: true,
    });
  } catch (error) {
    return errorResponse(res, 'SETTINGS_ERROR', 'Erro ao buscar configuracoes', 500);
  }
};

export const updatePageSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { page } = req.params;
    const { coverImageUrl, bannerTitle, bannerSubtitle, useFeaturedFallback } = req.body;

    const settings = await prisma.pageSettings.upsert({
      where: { page },
      update: {
        coverImageUrl: coverImageUrl ?? null,
        bannerTitle: bannerTitle ?? null,
        bannerSubtitle: bannerSubtitle ?? null,
        useFeaturedFallback: useFeaturedFallback ?? true,
      },
      create: {
        page,
        coverImageUrl: coverImageUrl ?? null,
        bannerTitle: bannerTitle ?? null,
        bannerSubtitle: bannerSubtitle ?? null,
        useFeaturedFallback: useFeaturedFallback ?? true,
      },
    });

    return successResponse(res, settings);
  } catch (error) {
    return errorResponse(res, 'SETTINGS_UPDATE_ERROR', 'Erro ao atualizar configuracoes', 500);
  }
};
