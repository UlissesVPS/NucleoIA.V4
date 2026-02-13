import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  return errorResponse(res, 'INTERNAL_ERROR', 'Erro interno do servidor', 500);
};
