import type { NextFunction, Request, Response } from "express";
import { ERROR_CODE } from "../constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../constants/error/error-messages.js";
import { HTTP_STATUS } from "../constants/http/http-status.js";

import { HttpError } from "../errors/http-error.js";
import { sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    const isInternalError = err.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR;

    if (isInternalError) {
      logger.error("Internal request error", {
        code: err.code,
        message: err.message,
        details: err.details,
      });
    }

    sendError(
      res,
      {
        code: err.code,
        message: isInternalError
          ? ERROR_MESSAGE.UNEXPECTED_SERVER_ERROR
          : err.message,
        details: isInternalError ? undefined : err.details,
      },
      err.status,
    );

    return;
  }

  logger.error("Unhandled request error", err);

  sendError(
    res,
    {
      code: ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGE.UNEXPECTED_SERVER_ERROR,
    },
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}
