import type { Response } from 'express';

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export function sendSuccess<T>(res: Response, data: T, message = 'OK', status = 200): void {
  res.status(status).json({ data, message });
}

export function sendError(res: Response, error: ApiErrorPayload, status = 400): void {
  res.status(status).json({ error });
}
