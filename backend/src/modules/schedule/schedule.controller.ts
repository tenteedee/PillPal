import type { NextFunction, Request, Response } from "express";

import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { RESPONSE_MESSAGE } from "../../shared/constants/http/response-messages.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { parseGetListInput } from "../../shared/utils/list.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { ScheduleRepository } from "./schedule.repository.js";
import { scheduleGetListInputSchema } from "./schedule.schema.js";
import { ScheduleService } from "./schedule.service.js";

const scheduleService = new ScheduleService(
  new ScheduleRepository(),
  new ProfileRepository(),
  new MedicationRepository(),
);

function requireScheduleId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

class ScheduleController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedules = await scheduleService.list(
        req.userId as string,
        parseGetListInput(req.query, scheduleGetListInputSchema),
      );
      sendSuccess(res, schedules);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedule = await scheduleService.create(req.userId as string, req.body);
      sendSuccess(res, schedule, RESPONSE_MESSAGE.CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scheduleId = requireScheduleId(req.params.id);
      const schedule = await scheduleService.getById(
        req.userId as string,
        scheduleId,
      );
      sendSuccess(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  updateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scheduleId = requireScheduleId(req.params.id);
      const schedule = await scheduleService.updateById(
        req.userId as string,
        scheduleId,
        req.body,
      );
      sendSuccess(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  pauseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scheduleId = requireScheduleId(req.params.id);
      const schedule = await scheduleService.pauseById(
        req.userId as string,
        scheduleId,
      );
      sendSuccess(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  deleteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scheduleId = requireScheduleId(req.params.id);
      await scheduleService.deleteById(req.userId as string, scheduleId);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  };
}

export const scheduleController = new ScheduleController();
