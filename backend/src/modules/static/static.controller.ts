import type { NextFunction, Request, Response } from "express";

import { RESPONSE_MESSAGE } from "../../shared/constants/http/response-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { StaticRepository } from "./static.repository.js";
import { StaticService } from "./static.service.js";
import type { StaticFilePurpose } from "./static.types.js";

const staticService = new StaticService(new StaticRepository());
const STATIC_FILE_PURPOSES = new Set<StaticFilePurpose>([
  "medication_image",
  "prescription_image",
  "general",
]);

function requireStaticId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

function parsePurpose(value: unknown): StaticFilePurpose {
  if (value === undefined || value === null || value === "") {
    return "general";
  }

  if (typeof value !== "string" || !STATIC_FILE_PURPOSES.has(value as StaticFilePurpose)) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value as StaticFilePurpose;
}

class StaticController {
  uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const uploadedImage = await staticService.uploadFile(
        req.userId as string,
        req.file,
        parsePurpose(req.body.purpose),
      );
      sendSuccess(
        res,
        uploadedImage,
        RESPONSE_MESSAGE.CREATED,
        HTTP_STATUS.CREATED,
      );
    } catch (error) {
      next(error);
    }
  };

  getFileById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const staticId = requireStaticId(req.params.id);
      const staticFile = await staticService.getFileById(
        req.userId as string,
        staticId,
      );
      sendSuccess(res, staticFile);
    } catch (error) {
      next(error);
    }
  };
}

export const staticController = new StaticController();
