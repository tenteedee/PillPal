import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { RESPONSE_MESSAGE } from "../../shared/constants/http/response-messages.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { ProfileRepository } from "./profile.repository.js";
import { ProfileService } from "./profile.service.js";

const profileService = new ProfileService(new ProfileRepository());

class ProfileController {
  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const profile = await profileService.getMe(req.userId as string);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const created = await profileService.create(req.userId as string, req.body);
      sendSuccess(res, created, RESPONSE_MESSAGE.CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };

  updateMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const updated = await profileService.updateMe(req.userId as string, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  };
}

export const profileController = new ProfileController();
