import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../errors/http-error.js';
import { sendError } from '../utils/response.js';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    sendError(
      res,
      {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      err.status,
    );

    return;
  }

  const fallbackMessage = err instanceof Error ? err.message : 'Unexpected server error';

  sendError(
    res,
    {
      code: 'INTERNAL_SERVER_ERROR',
      message: fallbackMessage,
    },
    500,
  );
}
