import type { NextFunction, Request, Response } from "express";

import { sendSuccess } from "../../shared/utils/response.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { MedicineLookupRepository } from "../medicine-lookup/medicine-lookup.repository.js";
import { MedicineLookupService } from "../medicine-lookup/medicine-lookup.service.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { AiRepository } from "./ai.repository.js";
import { AiService } from "./ai.service.js";

const profileRepository = new ProfileRepository();

const aiService = new AiService(
  new AiRepository(),
  profileRepository,
  new MedicationRepository(),
  new MedicineLookupService(
    new MedicineLookupRepository(),
    profileRepository,
  ),
);

class AiController {
  scanMedication = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const scanResult = await aiService.scanMedication(
        req.userId as string,
        req.body,
      );
      sendSuccess(res, scanResult);
    } catch (error) {
      next(error);
    }
  };

  confirmMedicationScan = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await aiService.confirmMedicationScan(
        req.userId as string,
        req.params.scanAttemptId as string,
        req.body,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export const aiController = new AiController();
