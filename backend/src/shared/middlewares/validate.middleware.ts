import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ERROR_CODE } from "../constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../constants/error/error-messages.js";
import { HTTP_STATUS } from "../constants/http/http-status.js";

import { HttpError } from "../errors/http-error.js";

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      next(
        new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODE.VALIDATION_ERROR,
          ERROR_MESSAGE.INVALID_REQUEST_BODY,
          parsed.error.flatten(),
        ),
      );
      return;
    }

    req.body = parsed.data;
    next();
  };
}
