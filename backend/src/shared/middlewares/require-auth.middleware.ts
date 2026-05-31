import type { NextFunction, Request, Response } from "express";

import { ERROR_CODE } from "../constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../constants/error/error-messages.js";
import { HTTP_STATUS } from "../constants/http/http-status.js";
import { HttpError } from "../errors/http-error.js";

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.userId) {
    next(
      new HttpError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODE.UNAUTHORIZED,
        ERROR_MESSAGE.MISSING_USER_IDENTITY,
      ),
    );
    return;
  }

  next();
}
