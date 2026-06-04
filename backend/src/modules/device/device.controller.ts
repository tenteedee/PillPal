import type { NextFunction, Request, Response } from "express";

import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { DeviceRepository } from "./device.repository.js";
import { DeviceService } from "./device.service.js";

const deviceService = new DeviceService(
  new DeviceRepository(),
  new ProfileRepository(),
);

function requirePushTokenId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

class DeviceController {
  registerPushToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = await deviceService.registerPushToken(
        req.userId as string,
        req.body,
      );
      sendSuccess(res, token);
    } catch (error) {
      next(error);
    }
  };

  listPushTokens = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tokens = await deviceService.listPushTokens(req.userId as string);
      sendSuccess(res, tokens);
    } catch (error) {
      next(error);
    }
  };

  deactivatePushToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tokenId = requirePushTokenId(req.params.id);
      const token = await deviceService.deactivatePushToken(
        req.userId as string,
        tokenId,
      );
      sendSuccess(res, token);
    } catch (error) {
      next(error);
    }
  };
}

export const deviceController = new DeviceController();
