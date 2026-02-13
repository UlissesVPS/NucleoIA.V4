import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';

export const handleUploadImage = (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'NO_FILE', 'Nenhum arquivo enviado', 400);
    }
    const url = `/uploads/images/${req.file.filename}`;
    return successResponse(res, { url, filename: req.file.filename });
  } catch (error) {
    return errorResponse(res, 'UPLOAD_ERROR', 'Erro no upload de imagem', 500);
  }
};

export const handleUploadThumbnail = (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'NO_FILE', 'Nenhum arquivo enviado', 400);
    }
    const url = `/uploads/thumbnails/${req.file.filename}`;
    return successResponse(res, { url, filename: req.file.filename });
  } catch (error) {
    return errorResponse(res, 'UPLOAD_ERROR', 'Erro no upload de thumbnail', 500);
  }
};

export const handleUploadVideo = (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'NO_FILE', 'Nenhum arquivo enviado', 400);
    }
    const url = `/uploads/videos/${req.file.filename}`;
    return successResponse(res, { url, filename: req.file.filename });
  } catch (error) {
    return errorResponse(res, 'UPLOAD_ERROR', 'Erro no upload de video', 500);
  }
};
