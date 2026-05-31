import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

import { HttpError } from '../errors/http-error.js';

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      next(new HttpError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten()));
      return;
    }

    req.body = parsed.data;
    next();
  };
}
