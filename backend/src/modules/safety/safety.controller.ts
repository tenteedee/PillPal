import type { NextFunction, Request, Response } from "express";

import { sendSuccess } from "../../shared/utils/response.js";
import { CaregiverRepository } from "../caregiver/caregiver.repository.js";
import { IntakeRepository } from "../intake/intake.repository.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { MedicineLookupRepository } from "../medicine-lookup/medicine-lookup.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { ScheduleRepository } from "../schedule/schedule.repository.js";
import { SafetyRepository } from "./safety.repository.js";
import { SafetyService } from "./safety.service.js";

const safetyService = new SafetyService(
  new SafetyRepository(),
  new ProfileRepository(),
  new MedicationRepository(),
  new MedicineLookupRepository(),
  new ScheduleRepository(),
  new IntakeRepository(),
  new CaregiverRepository(),
);

class SafetyController {
  check = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await safetyService.check(req.userId as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export const safetyController = new SafetyController();
