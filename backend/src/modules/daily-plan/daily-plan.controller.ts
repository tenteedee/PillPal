import type { NextFunction, Request, Response } from "express";

import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { IntakeRepository } from "../intake/intake.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { dailyPlanQuerySchema } from "./daily-plan.schema.js";
import { DailyPlanRepository } from "./daily-plan.repository.js";
import { DailyPlanService } from "./daily-plan.service.js";

const dailyPlanService = new DailyPlanService(
  new DailyPlanRepository(),
  new IntakeRepository(),
  new ProfileRepository(),
);

class DailyPlanController {
  today = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = dailyPlanQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new HttpError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODE.VALIDATION_ERROR,
          ERROR_MESSAGE.INVALID_REQUEST_BODY,
          parsed.error.flatten(),
        );
      }

      const dailyPlan = await dailyPlanService.getToday(
        req.userId as string,
        parsed.data,
      );
      sendSuccess(res, dailyPlan);
    } catch (error) {
      next(error);
    }
  };
}

export const dailyPlanController = new DailyPlanController();
