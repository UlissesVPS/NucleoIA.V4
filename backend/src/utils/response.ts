import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export const successResponse = <T>(res: Response, data: T, meta?: SuccessResponse<T>['meta'], status = 200) => {
  const response: SuccessResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(status).json(response);
};

export const errorResponse = (res: Response, code: string, message: string, status = 400) => {
  const response: ErrorResponse = { success: false, error: { code, message } };
  return res.status(status).json(response);
};
