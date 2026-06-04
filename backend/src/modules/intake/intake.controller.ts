import type { NextFunction, Request, Response } from "express";

import { parseGetListInput } from "../../shared/utils/list.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { CaregiverRepository } from "../caregiver/caregiver.repository.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { SafetyRepository } from "../safety/safety.repository.js";
import { ScheduleRepository } from "../schedule/schedule.repository.js";
import { IntakeRepository } from "./intake.repository.js";
import { intakeListInputSchema } from "./intake.schema.js";
import { IntakeService } from "./intake.service.js";

const intakeService = new IntakeService(
  new IntakeRepository(),
  new ProfileRepository(),
  new MedicationRepository(),
  new ScheduleRepository(),
  new SafetyRepository(),
  new CaregiverRepository(),
);

class IntakeController {
  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const intakes = await intakeService.list(
        req.userId as string,
        parseGetListInput(req.query, intakeListInputSchema),
      );
      sendSuccess(res, intakes);
    } catch (error) {
      next(error);
    }
  };

  listToday = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const intakes = await intakeService.listToday(req.userId as string);
      sendSuccess(res, intakes);
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
      const intake = await intakeService.create(req.userId as string, req.body);
      sendSuccess(res, intake, "Created", 201);
    } catch (error) {
      next(error);
    }
  };
}

export const intakeController = new IntakeController();
