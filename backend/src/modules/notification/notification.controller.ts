import type { NextFunction, Request, Response } from "express";

import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { parseGetListInput } from "../../shared/utils/list.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { NotificationRepository } from "./notification.repository.js";
import { notificationListInputSchema } from "./notification.schema.js";
import { NotificationService } from "./notification.service.js";

const notificationService = new NotificationService(
  new NotificationRepository(),
  new ProfileRepository(),
);

function requireNotificationId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

class NotificationController {
  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const notifications = await notificationService.listMyNotifications(
        req.userId as string,
        parseGetListInput(req.query, notificationListInputSchema),
      );
      sendSuccess(res, notifications);
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const notificationId = requireNotificationId(req.params.id);
      const notification = await notificationService.getMyNotificationById(
        req.userId as string,
        notificationId,
      );
      sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
