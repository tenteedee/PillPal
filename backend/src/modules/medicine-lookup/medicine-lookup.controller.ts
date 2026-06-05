import type { NextFunction, Request, Response } from "express";

import { ERROR_CODE } from "../../shared/constants/error/error-codes.js";
import { ERROR_MESSAGE } from "../../shared/constants/error/error-messages.js";
import { HTTP_STATUS } from "../../shared/constants/http/http-status.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { MedicationRepository } from "../medication/medication.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { MedicineLookupRepository } from "./medicine-lookup.repository.js";
import { MedicineLookupService } from "./medicine-lookup.service.js";

const medicineLookupService = new MedicineLookupService(
  new MedicineLookupRepository(),
  new ProfileRepository(),
  new MedicationRepository(),
);

function requireLookupId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODE.VALIDATION_ERROR,
      ERROR_MESSAGE.INVALID_REQUEST_BODY,
    );
  }

  return value;
}

class MedicineLookupController {
  run = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lookupId = requireLookupId(req.params.id);
      const lookup = await medicineLookupService.run(
        req.userId as string,
        lookupId,
      );
      sendSuccess(res, lookup);
    } catch (error) {
      next(error);
    }
  };

  saveMedication = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lookupId = requireLookupId(req.params.id);
      const result = await medicineLookupService.saveMedication(
        req.userId as string,
        lookupId,
        req.body,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export const medicineLookupController = new MedicineLookupController();
