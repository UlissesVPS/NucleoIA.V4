import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';

import { exec } from 'child_process';
import path from 'path';

// Post-process video to enable faststart (moov atom at beginning)
function fastStartVideo(filePath: string): Promise<void> {
  return new Promise((resolve) => {
    const tempPath = filePath + '.tmp.mp4';
    exec(
      `ffmpeg -y -i "${filePath}" -c copy -movflags +faststart "${tempPath}" && mv "${tempPath}" "${filePath}"`,
      { timeout: 300000 },
      (error) => {
        if (error) {
          console.error('faststart error:', error.message);
          // Clean up temp file on error
          exec(`rm -f "${tempPath}"`);
        }
        resolve(); // Always resolve, don't block upload on failure
      }
    );
  });
}

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

export const handleUploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'NO_FILE', 'Nenhum arquivo enviado', 400);
    }
    const url = `/uploads/videos/${req.file.filename}`;

    // Post-process: move moov atom to start for instant playback
    const filePath = req.file.path;
    fastStartVideo(filePath).catch(() => {}); // Fire and forget

    return successResponse(res, { url, filename: req.file.filename });
  } catch (error) {
    return errorResponse(res, 'UPLOAD_ERROR', 'Erro no upload de video', 500);
  }
};
